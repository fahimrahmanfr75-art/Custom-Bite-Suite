# Dynamic Delivery Fee Scope

## Scope

- Replace the flat `$3.50` fee in `src/utils/orderMath.ts` with a reusable pricing model.
- Keep checkout preview and persisted order totals on the same calculation path.
- Preserve rider earnings behavior by continuing to source earnings from each order's stored `deliveryFee`.

## Implemented Model

- Minimum fee: `$2.00`
- Included distance: first `1.0 km`
- Distance rate after included radius: `$0.50 / km`
- Fee cap: `$8.00`
- Free delivery threshold: subtotal `>= $50.00`
- Demand hook: optional multiplier input supported by the pricing function for future surge controls

## Operational Notes

- Short trips now price at the floor instead of the old `$3.50`, reducing small-basket friction.
- Long trips scale with Haversine distance from the manager kitchen coordinates to the delivery pin.
- Large baskets unlock free delivery without requiring another pricing path.
