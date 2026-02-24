

## Add Pulse Value "How It Works" Section

Currently, the How It Works section only covers Pulse Post (DMS connect, AI descriptions, post & track). We'll add a separate Pulse Value flow below it within the same section, showing how the appraisal tool works.

### Changes

**File: `src/components/landing/HowItWorks.tsx`**

1. Add a second set of steps for Pulse Value with 3 steps:
   - **01 - Enter VIN or plate**: "Type in a VIN, scan a plate, or search by year/make/model."
   - **02 - Get instant valuation**: "Our engine analyzes live market data from thousands of listings to give you an accurate value in seconds."
   - **03 - Share or export**: "Download a professional appraisal report or share it directly with your customer."

2. Add new icons for the Pulse Value steps (e.g., `Search`, `Zap`, `FileText` from lucide-react).

3. Structure the section with two labeled sub-sections:
   - A small product label/badge ("Pulse Post" and "Pulse Value") above each 3-card grid
   - Both grids use the same card styling and layout for visual consistency

4. Update the intro paragraph from "Three simple steps" to "Simple steps to transform your dealership operations." since there are now two flows.

### Layout

```text
[How It Works - Badge]
[Up and running in minutes - Heading]
[Simple steps to transform your dealership operations.]

-- Pulse Post (badge/label) --
[01 Connect DMS] [02 AI does the rest] [03 Post & track]

-- Pulse Value (badge/label) --
[01 Enter VIN]   [02 Instant valuation] [03 Share or export]
```

All changes are confined to `src/components/landing/HowItWorks.tsx`. No new files needed.

