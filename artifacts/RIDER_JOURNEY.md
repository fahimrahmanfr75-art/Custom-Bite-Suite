# Custom-Bite Suite: Delivery Rider Journey & Experience Guide

This document captures the entire user experience of the **Custom-Bite Suite** from the perspective of the **Rider**. It outlines the core workflows a rider undertakes during their shift—from accepting tasks to using integrated navigation, securely delivering food, and tracking their earnings.

---

## 1. Value Proposition & Rider Benefits

The Custom-Bite Suite provides an independent, structured interface precisely tailored to logistical needs.

**Key Benefits to the Rider:**
* **Autonomy in Tasking:** Riders maintain a high degree of agency. They can view available deliveries in their queue and manually claim the assignments they want.
* **Integrated Logistics Toolkit:** Distances, ETAs, Google Maps handoffs, and direct customer telematics are consolidated directly onto the assignment card, preventing app-switching confusion.
* **Real-time Live Tracking:** Under the hood, the app manages GPS hooks continuously while the assignments tab is active, seamlessly syncing the rider's coordinates backward to the customer's app for mutual transparency.
* **Earnings Clarity:** Absolute transparency regarding daily drops and earned delivery fees. No external spreadsheets are required; their financial dashboard handles the accounting.

---

## 2. The Delivery Shift: Rider Journey

The Rider application environment is focused heavily on action and speed, divided into three core tabs.

### Step 1: Shift Onboarding (`Profile` Tab)
**What they see:** A clean verification screen at the start of a session.
**Rider Actions & Functionality:**
* The rider verifies their current account details (Name, Username, Phone, Email).
* The rider uses this tab to securely log out at the end of their driving shift.

### Step 2: The Logistics Queue (`Assignments` Tab)
**What they see:** The active working zone of the application. Upon opening this Tab, the app securely spins up device GPS connectivity (`expo-location`), providing critical routing context.

**Part A: Claiming Deliveries**
* **Available Deliveries:** When the Manager marks an order as *On the way*, but no rider is assigned, it populates here.
* The rider sees high-level metrics of the job: the delivery address, what the items are, the customer's name, and whether it requires Cash Collection.
* *Action:* The rider taps **Accept Delivery** to successfully claim the job. The order now belongs to them.

**Part B: Managing "My Assignments"**
Once claimed, the order shifts to the active assignments board. Each assigned order is presented as a highly interactive **Rider Assignment Card**.

* **Smart Route Visualization:** A visual connection between the "Rider Location" (live GPS lock) and the customer's "Delivery Location". If the customer used the map pin, it displays exact geographic coordinates, allowing the app to calculate and display real-time **Distance** and **ETA metrics**.
* **Quick Tools:** Constant on-screen buttons to handle the most common issues without digging through menus:
  * *Call:* Immediately opens the phone dialer to call the customer.
  * *Navigate:* Uses deep-mapping to open Google Maps natively. If geographic coordinates exist, it routes perfectly to the GPS pin. If a manual address was used, it pipes the parsed string into the Maps search query automatically.
* **Granular Details Expansion:** By tapping "Details", the rider can see edge cases:
  * The exact breakdown of food (helpful if verifying items before leaving the store).
  * Direct "Delivery Notes" (e.g., "Leave at back door", "Gate code 1234").
  * **Payment Enforcement:** Explicit directions on whether the order is 'Paid' online or if the rider must demand 'Cash on Delivery' ('Pending Collection').
  * A "Contact Support" button launching a direct email to dispatch for severe issues.
* **Completion:** Upon reaching the destination and handing over the food, the rider taps **Delivered**. 
  * *Smart COD Handling:* If the order is COD, the system explicitly requires the rider to confirm they collected the cash before clearing it off their active board.

### Step 3: Financial Transparency (`Earnings` Tab)
**What they see:** An end-of-shift ledger visualizing their labor and compensation.
**Rider Actions & Functionality:**
* **Earnings Dashboard:** Top-level metrics summing their entire lifetime impact:
  * Total earnings generated specifically from Delivery Fees.
  * Total count of finalized deliveries.
  * The mathematical Average earned per delivery.
* **Delivery Ledger:** A chronological history of every single drop the rider has made.
  * Shows exact timestamps of delivery closure.
  * Reiterates the order contents and delivery endpoint.
  * Crucially, highlights the exact earnings badge representing the distinct fee generated for that singular delivery, creating trust and an indisputable record of work.

---

## Conclusion
The Rider Dashboard is built for motion. By stripping away administrative bloat, it ensures the rider has instant access to mapping hooks, phone dials, detailed routing instructions, and explicit payment collection commands within a maximum of one or two taps, ensuring higher throughput and lower error rates during deliveries.
