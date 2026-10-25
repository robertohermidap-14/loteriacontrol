<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Shared team data lives in Lovable Cloud through src/lib/store.ts with realtime reload; existing RLS permits assigned admin/comercial roles because this is an internal tool.
- Client copies use /recibo/$token outside AppShell, with random 256-bit capability tokens stored only as hashes in albaran_copias; a narrowly projected read-only RPC resolves one valid copy without granting anonymous table access.
- WhatsApp uses validated international phone numbers and wa.me text links; optional PDF file sharing uses the device share sheet, never a Business API connector.
- Receipt PDFs are generated from receipt data using pdf-lib, with page-aware layout and embedded signatures; the public copy has no settlement controls.

- Cash movements are immutable ledger rows created by role-checked transactional RPCs; cashier identity comes from the authenticated profile, and daily closures serialize against payments. Legacy payments remain explicitly unclassified rather than inventing a payment method or cashier.
- Receipt balances derive from delivered quantities minus returns and cumulative money received; new receipt numbers are assigned by a database sequence scoped by stable customer codes, preserving existing IDs and links.
- New stock entries represent explicit fractions as individual rows so complete series and loose tickets share the same assignment flow; legacy unspecified fractions remain unmodified.
- Cash ledger and closure RLS restrict commercial reads to their own Madrid-calendar day; administrators can read all periods. Shared operational receipt reads remain team-visible.
- Lottery selection partitions operational stock, receipts, payments and closures while client identities stay shared; payment classification derives from the receipt and closure totals are lottery-scoped.
- Caja owns both balance and receipt-list views; /cobro redirects to its receipt view to preserve existing navigation.
- Receipt DTOs carry administration branding and client contact fields through the capability-only RPC so anonymous PDF generation never reads internal configuration tables.
