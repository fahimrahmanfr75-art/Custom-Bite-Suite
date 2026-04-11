# Validation Checklist

## Authentication
- Login with correct seeded credentials for each role.
- Login with wrong role but correct username should fail.
- Registration with duplicate username/email/phone should fail.
- Registration with weak password or mismatched confirm password should fail.

## Customer
- Search for `jalapeno` returns burger dishes containing that ingredient.
- Add dish with ingredient removal and extra ingredient, then verify total changes.
- Place order with COD and verify new order appears as `pending`.
- Submit refund only once for a delivered order.
- Add or update a dish review.

## Manager
- Filter order board by `pending`, `preparing`, `delivered`.
- Advance status through `pending -> accepted -> preparing -> ready -> on_the_way -> delivered`.
- Create, edit, and delete a menu item.
- Approve or deny a refund and confirm the decision appears in history.
- Verify outstanding COD metric drops after rider confirms collection.

## Rider
- Open customer phone dialer from assignment screen.
- Open native maps from map view.
- Advance assigned order status.
- Confirm cash collected on COD order.
