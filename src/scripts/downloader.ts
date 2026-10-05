import {
	writeFileSync,
	readdirSync,
	readFileSync,
	mkdirSync,
	rmSync,
} from 'fs';
import { signIn, getDocuments } from '../utils/firebase';
import type { SubmittedDocument } from '../models/document';
import { validateCitizenId } from '../utils/validater';
import { csvFormat } from 'd3-dsv';
import { OUTPUT_DIR, SIGNATURE_OUTPUT_PREFIX } from './constants';

const TEMP_DIR = `${OUTPUT_DIR}/.tmp`;
const PAGE_LIMIT = 1000;
const WITH_SIGNATURE_MAX_ROW = 10000;

let lastCitizenId: string | undefined;
let batchCount = 1;
let isCompleted = false;

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
	console.error(
		'ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.',
	);
	process.exit(1);
}

await signIn(adminEmail, adminPassword);
console.log('Retrieving documents...');

rmSync(TEMP_DIR, { recursive: true, force: true });
mkdirSync(TEMP_DIR, { recursive: true });

do {
	const documents = await getDocuments(PAGE_LIMIT, lastCitizenId);

	lastCitizenId = documents.at(-1)?.citizenId;

	console.log(
		`Batch ${batchCount}: ${documents.at(0)?.citizenId} - ${lastCitizenId} (${documents.length}) are retrieved.`,
	);

	writeFileSync(
		`${TEMP_DIR}/documents-raw-${batchCount}.json`,
		JSON.stringify(documents),
	);

	batchCount++;
	isCompleted = documents.length < PAGE_LIMIT;
} while (!isCompleted);

const batchFiles = readdirSync(TEMP_DIR).filter((path) =>
	path.endsWith('.json'),
);

// Signatures are left on disk and referenced by `ref`, all of them don't fit in the heap
const documents = batchFiles.flatMap((path) =>
	readBatch(path).map(({ signature, ...document }, index) => ({
		...document,
		ref: `${path}:${index}`,
	})),
);

console.log(`Original data has ${documents.length} rows`);

const signatories = documents
	.filter(
		(s) =>
			s.firstname.length > 1 &&
			s.lastname.length > 1 &&
			validateCitizenId(s.citizenId),
	)
	.sort((z, a) => z.timestamp.seconds - a.timestamp.seconds)
	.filter(checkDuplicatedKeys(['citizenId', 'firstname', 'lastname']))
	.sort((z, a) => a.timestamp.seconds - z.timestamp.seconds)
	.map(
		({ prefix, firstname, lastname, timestamp, location, citizenId, ref }) => {
			return {
				citizenId,
				fullname: `${prefix.trim()} ${firstname.trim()} ${lastname.trim()}`,
				location: location.trim(),
				date: new Date(timestamp.seconds * 1000),
				ref,
			};
		},
	);

writeFileSync(
	`${OUTPUT_DIR}/signatories.csv`,
	csvFormat(signatories.map(({ ref, ...rest }) => rest)),
);

console.log(`Got ${signatories.length} signatories after cleaning`);

for (let i = 0; i * WITH_SIGNATURE_MAX_ROW < signatories.length; i++) {
	const rows = signatories.slice(
		i * WITH_SIGNATURE_MAX_ROW,
		(i + 1) * WITH_SIGNATURE_MAX_ROW,
	);
	const refs = new Set(rows.map(({ ref }) => ref));
	const signatures = new Map<string, string>();

	// ponytail: re-reads every batch file per output file (~10s each), write signatures into per-output temp files if it gets too slow
	for (const path of batchFiles) {
		readBatch(path).forEach(({ signature }, index) => {
			const ref = `${path}:${index}`;
			if (refs.has(ref)) signatures.set(ref, signature);
		});
	}

	writeFileSync(
		`${OUTPUT_DIR}/${SIGNATURE_OUTPUT_PREFIX}${i + 1}.csv`,
		csvFormat(
			rows.map(({ ref, ...row }) =>
				formatSignatoriesWithSignature({
					...row,
					signature: signatures.get(ref)!,
				}),
			),
		),
	);

	console.log(`Write ${SIGNATURE_OUTPUT_PREFIX}${i + 1}.csv`);
}

console.log(`Write CSV files into ${OUTPUT_DIR} successfully!`);

process.exit(0);

function readBatch(path: string): SubmittedDocument[] {
	return JSON.parse(readFileSync(`${TEMP_DIR}/${path}`, 'utf-8'));
}

function checkDuplicatedKeys<T extends Object>(keys: (keyof T)[]) {
	const seen = new Set<string>();

	return (obj: T) => {
		const key = JSON.stringify(keys.map((key) => obj[key]));
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	};
}

function formatSignatoriesWithSignature({
	citizenId,
	fullname,
	location,
	date,
	signature,
}: {
	citizenId: string;
	fullname: string;
	location: string;
	date: Date;
	signature: string;
}) {
	const [day, month, year] = date
		.toLocaleDateString('th-TH', { dateStyle: 'long' })
		.split(' ');

	return {
		citizenId,
		fullname,
		location,
		day,
		month,
		year,
		signature,
	};
}

export type SignatoriesWithSignature = ReturnType<
	typeof formatSignatoriesWithSignature
>;
