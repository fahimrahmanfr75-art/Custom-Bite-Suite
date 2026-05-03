# Custom-Bite Suite: Restaurant Manager Experience & Journey Guide

This document provides a highly detailed analysis of the **Custom-Bite Suite** exclusively from the perspective of the **Restaurant Manager**. It explains what the manager sees upon logging in, the tools available to them, and how they utilize the application to control the entire restaurant operation—from the kitchen to digital storefront management and finances.

---

## 1. Value Proposition & Manager Benefits

The Custom-Bite Suite equips restaurant managers with a powerful centralized control surface on a mobile-friendly device.

**Key Benefits to the Manager:**
* **Total Omnipresence:** The manager does not need to switch between different apps or devices to manage menus, track kitchen operations, and monitor finances. Everything is unified in one dashboard.
* **Granular Menu Control:** Unparalleled flexibility in how dishes are structured. Managers can dynamically build out extensive ingredient lists with nested pricing variations and strict logic rules without requiring a developer.
* **Live Operational Pulse:** A live-updating pipeline visualizes kitchen load and order status.
* **Instant Financial Insight & Autonomy:** Live revenue tracking and independent refund dispute resolution empower the manager to run operations cleanly without external support delays.

---

## 2. The Command Surface: Start-to-Finish Manager Journey

Upon authenticating as a "Manager", the user is greeted by the **Manager Command Center**. The interface is strictly divided into five core operational tabs to prevent cognitive overload.

### Tab 1: Live Command Center (`Command` Tab)
**What they see:** The real-time operational pulse of the restaurant. 
**Actions & Functionalities:**
* **Incoming Orders Triage:** A dedicated "Incoming Orders" section instantly highlights net-new orders placed by customers. The manager can instantly review the items ordered, the customer's history, their address, and the payment method. 
  * *Action:* One-tap **Accept** to send it directly to the kitchen pipeline, or **Reject** if the restaurant is out of stock or closed.
* **Kitchen Status Pipeline:** After acceptance, the manager tracks the precise state of the food. 
  * *Filtering:* Tabbed pills allow the manager to quickly filter the board by specific statuses (e.g., just show what is `preparing` or `ready`).
  * *Advancing Workflow:* Managers tap "Advance Status" to manually push orders through the pipeline: *Accepted → Preparing → Ready*. (The rider will take over the status once they pick it up).

### Tab 2: Storefront & Menu Control (`Menu` Tab)
**What they see:** The digital reflection of the restaurant. This is where managers control exactly what customers see on their apps.
**Actions & Functionalities:**
* **Promotional Banner System:**
  * Managers can unilaterally upload promotional images (directly from their device gallery using the Image Picker), write titles, and define descriptions.
  * They can toggle banners to be 'active' or 'hidden', dictating exactly what rotating marketing material customers see when they first open the app.
* **Dish Catalog Management:**
  * A comprehensive grid showing all current dishes alongside their live visibility status (`Available` or `Hidden`).
  * *Editing & Creation:* Managers can build dishes entirely from scratch. They can upload imagery from their device, define base prices, calorie counts, spice levels, and categorize them (e.g., "Mains", "Drinks").
* **Deep Ingredient Logic:** This is a crucial differentiator. Rather than just setting a dish price, managers can create limitless "Ingredient Categories" layered within a dish. For each ingredient, the manager sets:
  * **Price Delta:** Is it an extra $2 for cheese?
  * **Default flag:** Does this ingredient come on the item natively?
  * **Mandatory flag:** Does the customer literally *have* to have this (e.g., the bread on a sandwich), thereby preventing them from removing it on the app?

### Tab 3: Financial Health & Customer Disputes (`Finance` Tab)
**What they see:** The administrative and accounting layer of the restaurant operations.
**Actions & Functionalities:**
* **Revenue Tracking Snapshot:** Real-time calculated readouts of:
  * Daily Revenue
  * Weekly Revenue
  * Monthly Revenue 
  * Outstanding COD (Cash-On-Delivery money that riders need to return to the restaurant).
* **Refund Resolution Desk:** When a customer requests a refund from their app, it immediately appears here. 
  * The manager reads the customer's provided reason and detailed text.
  * *Action:* The manager exercises complete autonomy to either tap **Approve** (compensating the user) or **Deny** (rejecting the claim based on evidence). 

### Tab 4: Historical Records & Auditing (`History` Tab)
**What they see:** An immutable ledger of all finalized, closed orders.
**Actions & Functionalities:**
* **Order History:** Lists every order that has successfully been 'delivered', 'rejected', or 'canceled'.
* **Deep Dive Expansion:** Tapping "Expand" on any historical order provides an extreme breakdown of the transaction for dispute resolution or auditing:
  * Exact timestamps (when it was created vs. delivered).
  * The exact GPS coordinates and typed address of the delivery.
  * Which specific Rider delivered it and their phone number.
  * The granular item breakdown indicating *exactly* what customizations the customer originally requested in case of complaints (e.g., verifying if the customer really asked for "No Onions").

### Tab 5: Profile (`Profile` Tab)
**What they see:** Basic personnel verification.
**Actions & Functionalities:**
* View registered manager credentials (Email, Phone, Username) for administrative clarity and access the secure Logout functionality to lock down the terminal.

---

## Conclusion
The Manager Dashboard acts as a complete Point-Of-Sale, Kitchen Display System (KDS), and Storefront CMS rolled into one. It removes the necessity for restaurateurs to rely on third-party developers to change their menus or alter promotions. It guarantees they retain maximum control over incoming order velocity, revenue realization, and live kitchen throughput.
