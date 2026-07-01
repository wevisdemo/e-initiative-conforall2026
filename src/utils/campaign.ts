import dayjs from 'dayjs';
import Config from '../../e-initiative.config.mjs';

export const dayElapsed = Config.petition.endDate
	? -dayjs().diff(Config.petition.endDate, 'days')
	: Infinity;
export const isCampaignEnded = dayElapsed < 0;
