# Jack 40-year sales study — data method

This is a dashboard concept dataset, not a record of Jack Klemm’s actual transactions.

## What is factual

The annual price-index column is the U.S. Federal Housing Finance Agency All-Transactions House Price Index for San Joaquin County, California, FRED series `ATNHPIUS06077A`, annual and not seasonally adjusted. The source series is an index (`2000=100`), not a table of sale prices. It covers the exact 1986–2025 period used in this study.

Source: https://fred.stlouisfed.org/series/ATNHPIUS06077A — retrieved 2026-08-31.

FHFA describes these county indexes as developmental and notes that values can be revised. It calibrates them using sales prices and appraisals tied to mortgages bought or guaranteed by Fannie Mae and Freddie Mac.

## What is modeled

Every individual closing record, its volume, city mix, property characteristics, neighborhood label, and nominal price is modeled. The model uses the factual HPI to preserve the county’s historical appreciation, surge, correction, and recovery shape. It deliberately omits street addresses, owner names, and any claim that a listed row was actually closed by Jack.

The `recordClass` field is always `modeled`. Replace this ledger with Jack’s MLS/exported records before using any dashboard number as a performance claim.
