/** @type {import('./src/models/config').EInitiativeConfig} */
export default {
	metadata: {
		title: 'เขียนใหม่ทั้งฉบับ เลือกตั้ง100%',
		description: 'ต้องการ 50,000 ชื่อ เสนอคำถามประชามติ สู่รัฐธรรมนูญใหม่',
		siteUrl: 'https://wevisdemo.github.io/e-initiative-conforall2026/',
		previewImageUrl:
			'https://wevisdemo.github.io/e-initiative-conforall2026/og.png',
	},
	petition: {
		endDate: new Date('2026-06-30T00:00:00+07:00'),
		expectedSignatures: 50000,
		offline: {
			formUrl: 'petition-form.pdf',
			formExampleImageUrl: 'image/petition-form.jpg',
			headquarter: {
				name: 'ออฟฟิศ iLaw 099-678-6031',
				address:
					'1111/3 บ้านกลางเมืองรัชดา-ลาดพร้าว ถ.ลาดพร้าว แขวงจันทรเกษม เขตจตุจักร กทม. 10900',
				embedGoogleMapUrl:
					'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3874.5792700399415!2d100.57731679999999!3d13.8042179!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29f78881156fb%3A0x7356cb8f9a29f043!2z4Lit4Liy4LiE4Liy4LijIEFMTCBSSVNFIChpTGF3KQ!5e0!3m2!1sen!2sth!4v1781152200705!5m2!1sen!2sth',
			},
			// volunteer: {
			// 	registrationFormUrl: '#volunteer-register',
			// 	assetsUrl: '#asset',
			// 	contact: {
			// 		name: 'ชื่อช่องทาง',
			// 		url: '#contact',
			// 	},
			// },
		},
	},
	theme: {
		colors: {
			primary: '#2E3283',
			'primary-focus': '#4349BA',
			secondary: '#2BB25C',
			'secondary-focus': '#35D26E',
			accent: '#8054FF',
			'accent-focus': '#5929E3',
			neutral: '#000000',
			'base-100': '#FFFFFF',
			'base-300': '#E5E6E6',
			info: '#F8EB54',
		},
		fonts: {
			body: 'Prompt',
			'heading-fixed': 'Prompt',
			'heading-responsive': 'Prompt',
			link: 'Prompt',
		},
		stylesheets: [
			'https://fonts.googleapis.com/css2?family=Prompt:wght@100;200;300;400;500;600;700;800;900&display=swap',
		],
	},
	sheets: {
		id: '1PPl4bIKrNC68nc9sWDp7aolnTv0xiHZYQRlsvnRpAHc',
		enableOfflineSignature: true,
		enableLocations: false,
	},
	renderer: {
		templateFile: './public/petition-form.pdf',
		fontFile: './src/fonts/Sarabun-Regular.ttf',
		fontSize: 10,
		lineHeight: 14,
		fields: [
			{ key: 'location', type: 'text', x: 375, y: 665, maxWidth: 160 },
			{ key: 'day', type: 'text', x: 317, y: 644 },
			{ key: 'month', type: 'text', x: 376, y: 644, maxWidth: 83 },
			{ key: 'year', type: 'text', x: 496, y: 644 },
			{ key: 'fullname', type: 'text', x: 229, y: 589, maxWidth: 290 },
			{
				key: 'citizenId',
				type: 'text',
				x: 223,
				y: 537,
				fontSize: 22,
				lineHeight: 30,
				split: {
					by: '',
					getOffsetX: (_, i) =>
						i * 22 /* digit width */ +
						[0, 4, 9, 11].filter((d) => d < i).length * 6.5 /* dash width */,
				},
			},
			{
				key: 'signature',
				type: 'image',
				x: 325,
				y: 370,
				maxWidth: 100,
				maxHeight: 50,
			},
			{ key: 'fullname', type: 'text', x: 318, y: 365, maxWidth: 120 },
		],
	},
};
