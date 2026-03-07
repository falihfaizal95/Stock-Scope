# StockScope Changelog

## 2026-03-07

- `b96700d` Avoid repeated duplicate news card images.
  - News cards now rotate fallbacks and avoid repeating the same image across the feed view.

- `ccbb964` Add current holdings section under portfolio graph.
  - Home page now shows a `Current Holdings` block directly under the Individual portfolio graph.
  - Displays symbol, shares, position value, and gain/loss ($ and %), linked to stock detail.

- `6dd3577` Gate stock trading by US market hours and queue off-hours orders.
  - US equities/ETFs restricted to 9:30 AM-4:00 PM ET on weekdays, excluding major US market holidays.
  - Off-hours stock/ETF orders are queued with explicit user messaging.
  - Crypto remains tradable 24/7.
  - Fractional buy flow allowed outside regular hours.

- `33e19b6` Harden news images and expand news feed volume.
  - Backend now normalizes/filters image hosts and applies stable fallbacks.
  - News feed size increased and fallback feed expanded.

- `0ac4e6e` Make News tab refresh reliable on repeat tap.
  - Added reliable event-based refresh handling for the News tab.
  - Added visible Refresh action in News header.

- `347ce50` Improve news UX, refresh behavior, and article fallbacks.
  - Added back navigation in article view.
  - Improved article summary rendering and detail readability.
  - Removed forced `By StockScope` author display.
  - Added stronger frontend/backend news image fallback behavior.

- `51e186d` Ensure market movers never return empty.
  - Merged real mover data with fallback mover dataset to avoid blank home lists.

- `6c4c8e9` Show more top gainers on home screen.
  - Increased number of top gainers/losers displayed.

- `5ffcc82` Restore card imagery and redesign search discovery sections.
  - Improved visual cards and replaced search idle content with trading-oriented sections.

- `aad76f2` Commit Vercel deployment config and web API base URL.
  - Added deployment config and environment-aware API base URL behavior for web.

## Notes

- Canonical source of truth remains Git history (`git log`).
- This file summarizes recent implementation work for quick auditability.
