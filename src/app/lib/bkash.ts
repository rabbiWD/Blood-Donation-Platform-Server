import httpStatus from "http-status";
import config from "../config/index.js";
import { AppError } from "../errors/AppError.js";

interface IBkashGrantTokenResponse {
	statusCode: string;
	statusMessage: string;
	id_token: string;
	token_type: string;
	expires_in: string | number;
	refresh_token: string;
}

export interface IBkashCreatePaymentParams {
	amount: number | string;
	payerReference: string;
	callbackURL?: string;
	merchantInvoiceNumber: string;
}

export interface IBkashCreatePaymentResponse {
	statusCode: string;
	statusMessage: string;
	paymentID: string;
	bkashURL: string;
	callbackURL: string;
	amount: string;
	currency: string;
	intent: string;
	merchantInvoiceNumber: string;
	paymentCreateTime: string;
	transactionStatus: string;
}

export interface IBkashExecutePaymentResponse {
	statusCode: string;
	statusMessage: string;
	paymentID: string;
	trxID: string;
	transactionStatus: string;
	amount: string;
	currency: string;
	intent: string;
	paymentExecuteTime: string;
	merchantInvoiceNumber: string;
	payerType?: string;
	payerReference?: string;
	customerMsisdn?: string;
}

export interface IBkashQueryPaymentResponse {
	statusCode: string;
	statusMessage: string;
	paymentID: string;
	trxID?: string;
	transactionStatus: string;
	amount: string;
	currency: string;
	intent: string;
	merchantInvoiceNumber: string;
	verificationStatus?: string;
}

// In-memory token cache fallback
let cachedToken: {
	id_token: string;
	expiresAt: number;
} | null = null;

// bKash's API sometimes returns strings containing unescaped raw newlines/control characters.
// This helper sanitizes and parses the response safely without crashing JSON.parse.
const parseBkashResponse = async <T>(response: Response): Promise<T> => {
	const text = await response.text();
	try {
		return JSON.parse(text) as T;
	} catch {
		const cleaned = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, (char) => {
			if (char === "\n" || char === "\r" || char === "\t") {
				return " ";
			}
			return "";
		});
		return JSON.parse(cleaned) as T;
	}
};

const grantToken = async (): Promise<string> => {
	const now = Date.now();
	// If cached token is valid for at least 5 more minutes, reuse it
	if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
		return cachedToken.id_token;
	}

	try {
		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/token/grant`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					username: config.bkash_username,
					password: config.bkash_password,
				},
				body: JSON.stringify({
					app_key: config.bkash_app_key,
					app_secret: config.bkash_app_secret,
				}),
			},
		);

		const data = await parseBkashResponse<IBkashGrantTokenResponse>(response);

		if (data.statusCode && data.statusCode !== "0000") {
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				`bKash Token Grant Failed: ${data.statusMessage || "Invalid credentials"}`,
			);
		}

		if (!data.id_token) {
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				"bKash Token Grant did not return an id_token",
			);
		}

		const expiresInSeconds = Number(data.expires_in) || 3600;
		cachedToken = {
			id_token: data.id_token,
			expiresAt: now + expiresInSeconds * 1000,
		};

		return data.id_token;
	} catch (error: unknown) {
		if (error instanceof AppError) throw error;
		const message = error instanceof Error ? error.message : "Unknown error";
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			`Failed to communicate with bKash Grant Token API: ${message}`,
		);
	}
};

const createPayment = async (
	params: IBkashCreatePaymentParams,
): Promise<IBkashCreatePaymentResponse> => {
	const token = await grantToken();

	const callbackURL = params.callbackURL || config.bkash_callback_url;
	const formattedAmount = Number(params.amount).toFixed(2);

	try {
		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/create`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: token,
					"X-App-Key": config.bkash_app_key,
				},
				body: JSON.stringify({
					mode: "0011",
					payerReference: params.payerReference,
					callbackURL,
					amount: formattedAmount,
					currency: "BDT",
					intent: "sale",
					merchantInvoiceNumber: params.merchantInvoiceNumber,
				}),
			},
		);

		const data =
			await parseBkashResponse<IBkashCreatePaymentResponse>(response);

		if (data.statusCode && data.statusCode !== "0000") {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				`bKash Create Payment Failed: ${data.statusMessage || "Error initiating bKash checkout"}`,
			);
		}

		return data;
	} catch (error: unknown) {
		if (error instanceof AppError) throw error;
		const message = error instanceof Error ? error.message : "Unknown error";
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			`bKash Create Payment Request Error: ${message}`,
		);
	}
};

const executePayment = async (
	paymentID: string,
): Promise<IBkashExecutePaymentResponse> => {
	const token = await grantToken();

	try {
		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/execute`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: token,
					"X-App-Key": config.bkash_app_key,
				},
				body: JSON.stringify({ paymentID }),
			},
		);

		const data =
			await parseBkashResponse<IBkashExecutePaymentResponse>(response);
		return data;
	} catch (error: unknown) {
		if (error instanceof AppError) throw error;
		const message = error instanceof Error ? error.message : "Unknown error";
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			`bKash Execute Payment Request Error: ${message}`,
		);
	}
};

const queryPayment = async (
	paymentID: string,
): Promise<IBkashQueryPaymentResponse> => {
	const token = await grantToken();

	try {
		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/payment/status`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: token,
					"X-App-Key": config.bkash_app_key,
				},
				body: JSON.stringify({ paymentID }),
			},
		);

		const data = await parseBkashResponse<IBkashQueryPaymentResponse>(response);
		return data;
	} catch (error: unknown) {
		if (error instanceof AppError) throw error;
		const message = error instanceof Error ? error.message : "Unknown error";
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			`bKash Query Payment Request Error: ${message}`,
		);
	}
};

export const BkashClient = {
	grantToken,
	createPayment,
	executePayment,
	queryPayment,
};
