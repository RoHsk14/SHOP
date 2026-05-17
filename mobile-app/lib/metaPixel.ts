import { WEB_APP_URL } from './config';

interface PurchaseData {
  value: number;
  currency: string;
  num_items: number;
  content_ids: string[];
  content_name: string;
  content_type: string;
}

export async function trackPurchase(data: PurchaseData): Promise<void> {
  try {
    await fetch(`${WEB_APP_URL}/api/meta/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'Purchase',
        event_data: {
          value: data.value,
          currency: data.currency,
          num_items: data.num_items,
          content_ids: data.content_ids,
          content_name: data.content_name,
          content_type: data.content_type,
        },
      }),
    });
  } catch (err) {
    console.error('CAPI tracking error:', err);
  }
}
