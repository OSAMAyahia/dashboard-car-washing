import { customerUrl } from '@/lib/customer-url';
import { Button, useToast } from '@/components/ui';

export function CustomerSiteLink({ slug }: { slug: string }) {
  const url = customerUrl(slug);
  const toast = useToast();
  async function copy() {
    try { await navigator.clipboard.writeText(url); toast('تم نسخ رابط العملاء'); }
    catch { toast('تعذر النسخ، انسخ الرابط الظاهر يدويًا', 'error'); }
  }
  return <div className="flex flex-wrap items-center gap-2 text-sm">
    <a href={url} target="_blank" rel="noopener noreferrer" dir="ltr" className="break-all text-accent underline">{url}</a>
    <Button size="sm" variant="ghost" onClick={copy}>نسخ رابط العملاء</Button>
  </div>;
}
