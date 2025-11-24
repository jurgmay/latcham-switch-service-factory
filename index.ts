import * as fs from 'fs';
import * as tmp from 'tmp';
import { createHttpClient } from '../Resources/switch-http-factory';

interface Configuration {
	defaultDatasetKey: string;
	httpHeaders: Record<string, string>;
	baseUrl: string;
	debug: boolean;
	job: Job;
}

export function createSwitchService(config: Configuration) {
	const DEBUG = config.debug;
	const ORDER_DATASET_KEY = config.defaultDatasetKey;
	const BASE_URL = config.baseUrl;
	const HTTP_HEADERS = config.httpHeaders;

	const httpClient = createHttpClient({
		baseURL: BASE_URL,
		headers: HTTP_HEADERS,
		debug: DEBUG,
		job: config.job,
	});

	async function createDataset(job: Job, data: {}, datasetName?: string) {
		datasetName = datasetName || ORDER_DATASET_KEY;

		let dataset = tmp.fileSync({ postfix: 'json' }).name;
		fs.writeFileSync(dataset, JSON.stringify(data));

		await job.createDataset(datasetName || ORDER_DATASET_KEY, dataset, DatasetModel.JSON);

		if (DEBUG) await job.log(LogLevel.Debug, `CREATED DATASET: ${datasetName}`);
		if (DEBUG) await job.log(LogLevel.Debug, `DATA: ${JSON.stringify(data).slice(0, 500) + '...'}`);

		return true;
	}

	async function getDataset(job: Job, datasetName?: string) {
		datasetName = datasetName || ORDER_DATASET_KEY;

		const datasets = await job.listDatasets();
		if (!datasets.find((dataset) => dataset.name === datasetName)) {
			return null;
		}

		let datasetPath = await job.getDataset(datasetName, AccessLevel.ReadOnly);
		return await JSON.parse(fs.readFileSync(datasetPath, { encoding: 'utf8' }));
	}

	return {
		createDataset,
		getDataset,
		httpClient,
	};
}
