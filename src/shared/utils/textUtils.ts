export class TextUtils {
	public static sanitize(unsafeText: string): string {
		return unsafeText
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	public static validateWebURL(url: string): boolean {
		try {
			const parsed = new URL(url);
			return parsed.protocol === 'http:' || parsed.protocol === 'https:';
		} catch {
			return false;
		}
	}

	public static validateEmailAddress(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	public static createRandomNumericString(numberDigits: number): string {
		const chars = '0123456789';
		let value = '';

		for (let i = numberDigits; i > 0; --i) {
			value += chars[Math.round(Math.random() * (chars.length - 1))];
		}

		return value;
	}
}
