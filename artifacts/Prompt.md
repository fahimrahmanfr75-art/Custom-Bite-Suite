## Task : Create a Single-Vendor android Food Delivery App (Proprietary App) with integrated database management system. it's a branded android app with order aggregation systems for single restaurant called "Custom-Bite Suite". the app must follow industry standard requirements and must solve real life problems. there will be three types of users such as customer, restaurant manager and delivery person each with their own authentication way and database system.

### Minimum Mandatory Customer recommendation include:

1. #### Search: As a customer, I want to search for dishes by both name and ingredient so that I can confirm the menu meets my dietary needs.

2. #### Browsing: As a customer, I want to browse the categorized menu and view current offers so that I can decide if the restaurant has food I want to order.

3. #### Customization:
    - #### 3.1. As a customer, I want to add or remove specific ingredients to adjust my order so that my meal is prepared exactly how I like it.
    - #### 3.2. As a customer, I want to add items to a digital cart and adjust quantities so that I can manage my order before paying.

4. #### Real-time Tracking: As a customer, I want full transparency over my order. I want to see the status of my order in every step. I want to see:
    - #### 4.1. whether or not the order got accepted or not,
    - #### 4.2. whether or not the order is being prepared in the kitchen, 
    - #### 4.3. whether or not the order is prepared and sitting cold in the counter waiting for the rider to collect, 
    - #### 4.4. whether or not the order is collected by the delivery person and is on the way. 
    - #### 4.5. I want to see my assigned rider and contact them so that I can provide specific navigation details.

5. #### Refund Request: As a customer, I want to submit a complaint or refund request for an order so that I am compensated if the service is unsatisfactory.

6. #### History & COD: As a customer, I want to view my previous orders so that I can easily re-order my favourite meals and select Cash on Delivery so that I have flexibility in how I track and pay for my meals.

7. #### Review: As a customer, I want to view the full specification and price of any dish so that I can understand the value and quality before ordering. Also, I want to see reviews of dishes and comments for each dish before ordering items/dishes and also I want to be able to leave my own review and comment to help other make a decision as well.

### Minimum Mandatory Restaurant manager recommendation include:

1. #### Dynamic Menu Control: As an admin, I want to add, delete, or update menu items and prices so that the digital menu reflects our current kitchen inventory. Real-time CRUD (Create, Read, Update, Delete) operations for dishes, prices, and ingredient availability.

2. #### Order Command Center: As an admin, I want to see a list of all customers and filter orders by Pending or Delivered status so that I can manage kitchen workflow.
    - #### Filter orders by Pending, In-Progress, or Delivered.
    - #### View full customer profiles and rider assignments.

3. #### Financial Dashboard:
    - #### Daily/Weekly/Monthly earnings analytics.
    - #### Refund Management: Review and approve/deny customer refund requests.

4. #### Audit Logs: Detailed history of every transaction, including which rider handled which customer. As a restaurant manager, I want to keep a detailed delivery list/history of all orders including customer and rider information so that I can correctly maintain and keep a track of the business.

### Minimum Mandatory Rider recommendation include:

1. #### Navigation & Contact: As a rider, I want to access the customer's contact info and delivery notes so that I can deliver the food efficiently.

2. #### Payment Reconciliation: As a rider, I want to confirm that I have collected the cash for COD orders so that the admin can verify the transaction and update the total earnings.

3. #### Delivery Logistics:
    - #### Access to customer location via map integration, phone contact, and specific delivery notes (e.g., "Gate code 1234").
4. #### Cash Reconciliation:
    - #### A "Confirm Cash Collected" toggle for COD orders that instantly updates the Manager’s financial ledger.
5. #### Status Updates: One-tap updates to inform the customer the order is "On the Way" or "Delivered."



### App Testing: 
- create an emulator so i can test the working capabilities of the app so i can suggest for improvements.
- Create apk version of the app so i can share/send the app to my physical phone to full test the performance of the app.

### Personal word:
It is mandatory to have an integrated database management system with proper relation in this app. Create as many tables as needed to store information. Some of the Entities i think are Users(Customer, restaurant manager, delivery person), menu, order, status dish, ingredient, price, review, payment, history of everything etc. Also, the authentication is needed for all user (Customer, reataurant manager and delivery person). follow existing modern authentication systems for context.