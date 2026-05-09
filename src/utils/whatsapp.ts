import { Linking, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function normalizePhone(phone?: string): string {
  if (!phone) return '';
  // Strip all non-digits, keep optional + via country code
  const digits = phone.replace(/[^0-9]/g, '');
  return digits;
}

/**
 * Share a generated PDF via WhatsApp.
 * Strategy:
 *  - On native: open whatsapp:// scheme with phone (if provided) + open share sheet for the PDF (since URL scheme cannot attach files).
 *  - On web: open wa.me link in a new tab.
 */
export async function shareViaWhatsApp(html: string, fileName: string, phone?: string, message?: string): Promise<void> {
  const phoneDigits = normalizePhone(phone);
  const text = encodeURIComponent(message || `كشف حساب: ${fileName.replace(/\.pdf$/, '')}`);

  if (Platform.OS === 'web') {
    const target = phoneDigits ? `https://wa.me/${phoneDigits}?text=${text}` : `https://wa.me/?text=${text}`;
    if (typeof window !== 'undefined') window.open(target, '_blank');
    return;
  }

  // Generate PDF first
  let uri = '';
  try {
    const out = await Print.printToFileAsync({ html });
    uri = out.uri;
  } catch {}

  // Try native WhatsApp scheme to trigger app
  const scheme = phoneDigits
    ? `whatsapp://send?phone=${phoneDigits}&text=${text}`
    : `whatsapp://send?text=${text}`;

  let waOpened = false;
  try {
    const supported = await Linking.canOpenURL('whatsapp://send');
    if (supported) {
      await Linking.openURL(scheme);
      waOpened = true;
    }
  } catch {}

  // Then open share sheet so user can attach the PDF (WhatsApp can't accept file via URL scheme)
  if (uri) {
    const ok = await Sharing.isAvailableAsync();
    if (ok) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName, UTI: 'com.adobe.pdf' });
      return;
    }
  }

  // Fallback if no PDF and WhatsApp not opened: open wa.me universal link
  if (!waOpened) {
    const target = phoneDigits ? `https://wa.me/${phoneDigits}?text=${text}` : `https://wa.me/?text=${text}`;
    await Linking.openURL(target);
  }
}
