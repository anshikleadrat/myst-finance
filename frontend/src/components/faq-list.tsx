import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

/** Answers stay in the DOM when collapsed (forceMount) so crawlers see the full FAQ text. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Accordion type="single" collapsible className="divide-y divide-border rounded-2xl border border-border bg-white px-5">
      {items.map((item, index) => (
        <AccordionItem key={item.q} value={`faq-${index}`} className="border-none">
          <AccordionTrigger className="py-5 text-left text-base font-semibold text-navy hover:no-underline">{item.q}</AccordionTrigger>
          <AccordionContent forceMount className="text-[0.95rem] leading-7 text-muted-foreground in-data-[state=closed]:hidden">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
