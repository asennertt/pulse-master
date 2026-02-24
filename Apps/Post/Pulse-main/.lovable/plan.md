
## Update URL Parameter Logic in DispatcherPanel

### What needs to change

In `src/components/DispatcherPanel.tsx`, the URL construction at **line 73** (Step 5 of `runWorkflow`) needs to be rewritten to use the exact variable-assignment pattern you specified.

**Current code (line 73):**
```typescript
const builtUrl = 'https://www.facebook.com/marketplace/create/vehicle/?price=' + vehicle.price + '&desc=' + encodeURIComponent(aiCopy) + '&mileage=' + vehicle.mileage + '&vin=' + vehicle.vin;
```

**New code:**
```typescript
const price = vehicle.price || "0";
const desc = encodeURIComponent(aiCopy || "");
const mileage = vehicle.mileage || "";
const vin = vehicle.vin || "";

const fbUrl = `https://www.facebook.com/marketplace/create/vehicle/?price=${price}&desc=${desc}&mileage=${mileage}&vin=${vin}`;

console.log("Pulse: Opening URL:", fbUrl);
window.open(fbUrl, '_blank');
```

Note on `description`: The `Vehicle` type has no `description` field. The runtime AI-generated text (`aiCopy`) is the correct equivalent — it is used as `desc` in the URL, which is what the Pulse extension reads.

### What stays the same

- `setFbUrl(builtUrl)` → updated to `setFbUrl(fbUrl)` (just variable rename)
- The existing `window.open` on line 75 is replaced by the one inside the new block
- All other workflow steps (AI generation, clipboard copy, etc.) remain untouched
- The "Open Facebook" button in the success state still uses `fbUrl` from state

### Technical details

- File: `src/components/DispatcherPanel.tsx`
- Lines affected: 72–75 (the Step 5 block)
- The `console.log("Pulse: Opening URL:", fbUrl)` is added so you can verify in DevTools that the URL contains all four query parameters before the tab opens
- Fallback values (`|| "0"`, `|| ""`) guard against null/undefined fields
