import { initializeApp, getApp, type FirebaseApp } from 'firebase/app';
import {
	getAuth,
	signInAnonymously,
	signInWithEmailAndPassword,
	connectAuthEmulator,
} from 'firebase/auth';
import {
	getFunctions,
	httpsCallable,
	connectFunctionsEmulator,
} from 'firebase/functions';
import FirebaseOptions from '../../firebase.json';
import { type FormDocument, type SubmittedDocument } from '../models/document';

let app: FirebaseApp;

try {
	app = getApp();
} catch {
	app = initializeApp(JSON.parse(getEnv('PUBLIC_FIREBASE_CONFIG') || '{}'));
}

const auth = getAuth();
const functions = getFunctions(app);
const isEmulator =
	import.meta.env?.DEV || process.env?.NODE_ENV === 'development';

if (isEmulator) {
	connectAuthEmulator(
		auth,
		`http://127.0.0.1:${FirebaseOptions.emulators.auth.port}`,
	);
	connectFunctionsEmulator(
		functions,
		'127.0.0.1',
		FirebaseOptions.emulators.functions.port,
	);
}

export const signIn = (email: string, password: string) =>
	signInWithEmailAndPassword(auth, email, password);

export const submitDocument = async (
	document: FormDocument,
	turnstileToken: string,
) => {
	if (getEnv('PUBLIC_DEMO_MODE')) {
		console.log(document);
		return new Promise<void>((res) => setTimeout(res, 2000));
	}

	await signInAnonymously(auth);

	const submitFn = httpsCallable(functions, 'submitDocument');
	await submitFn({ document, turnstileToken });
};

export const countSubmittedDocuments = async (): Promise<number> => {
	try {
		const countFn = httpsCallable<void, { count: number }>(
			functions,
			'countDocuments',
		);
		const result = await countFn();
		return result.data.count;
	} catch (e) {
		console.warn(e);
		return 0;
	}
};

export async function getDocuments(
	pageLimit: number,
	lastCitizenId?: string,
): Promise<SubmittedDocument[]> {
	// httpsCallable retains every response in memory (Promise.race with the never-settling cancelAllRequests), so call the endpoint directly
	const { projectId } = app.options;
	const url = isEmulator
		? `http://127.0.0.1:${FirebaseOptions.emulators.functions.port}/${projectId}/us-central1/listDocuments`
		: `https://us-central1-${projectId}.cloudfunctions.net/listDocuments`;

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
		},
		body: JSON.stringify({ data: { pageLimit, lastCitizenId } }),
	});
	const body = await res.json();

	if (!res.ok) throw new Error(body.error?.message ?? res.statusText);
	return body.result.documents;
}

function getEnv(key: string) {
	return (
		import.meta.env?.[key] ||
		(typeof process !== 'undefined' && process.env?.[key])
	);
}
