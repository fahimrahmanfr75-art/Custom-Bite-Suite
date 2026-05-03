# 1. Introduction

## 1.1. Problem Specification/Statement

In the rapidly evolving landscape of the food and beverage industry, customers are increasingly demanding a higher degree of personalization and transparency. Traditional food delivery platforms often operate as rigid intermediaries, providing limited scope for granular dish customization. Most existing systems treat "modifications" as simple text notes, which are frequently overlooked in a busy kitchen environment and fail to account for inventory or pricing accuracy. 

Furthermore, small to medium-sized single-vendor restaurants face a significant barrier to entry when adopting digital management suites. They are often forced to choose between complex, expensive cloud-based subscriptions—which require constant internet connectivity and high transaction fees—or fragmented manual systems that rely on physical tickets and prone-to-error verbal communication between staff and delivery riders. 

There is a critical need for a self-contained, high-performance mobile solution that integrates the entire delivery lifecycle—from the customer’s precise ingredient selections and the manager’s kitchen command to the rider’s real-time logistics—within a unified, secure, and offline-capable environment.

## 1.2. Objectives

The primary objective of the **Custom-Bite Suite** is to bridge the gap between boutique dining customization and operational efficiency through a multi-role mobile ecosystem. Specifically, the project aims to:

1.  **Implement a Granular Customization Engine**: Develop a system that allows customers to modify dishes at the ingredient level, supporting mandatory, default, and optional additions with real-time price delta calculations.
2.  **Enable Multi-Role Coordination**: Provide three distinct, specialized dashboards (Customer, Manager, and Rider) that communicate through a shared local database, ensuring that every stakeholder has the exact data they need to perform their role.
3.  **Deliver High-Fidelity Logistics Tracking**: Utilize native device GPS and mathematical models (Haversine formula) to provide accurate distance, bearing, and ETA tracking for both riders and customers.
4.  **Ensure Operational Transparency and Integrity**: Implement a comprehensive, tamper-evident audit logging system that records all critical system transitions, paired with an "Ingredient Snapshot" feature to preserve the historical state of orders.
5.  **Develop a Premium, High-Performance UI**: Create a state-of-the-art "Onyx & Ember" visual identity using glassmorphism and 3D-layered components to provide a "luxury" user experience that matches the quality of the food.

## 1.3. Motivation and Scope

**Motivation:**
The motivation behind Custom-Bite Suite stems from the desire to empower independent culinary vendors with a digital "Command Center" that rivals global delivery giants in technical sophistication, while remaining local-first and lightweight. By utilizing React Native and SQLite, the project demonstrates that high-end features like real-time tracking, complex transitions, and financial auditing can be achieved without the overhead of massive server infrastructure.

**Scope:**
The scope of the Custom-Bite Suite includes:
-   **Platform**: Android-ready mobile application developed using React Native and the Expo managed workflow.
-   **Data Management**: A local-first architecture utilizing an embedded SQLite database with atomic transaction handling.
-   **User Roles**: Full implementation of Customer ordering, Managerial kitchen control (including menu/banner management), and Rider delivery logistics.
-   **Core Modules**: Persistent authentication (SHA-256), Itemized Cart, Live GPS Tracking, Financial Reconciliation, Refund Management, and Audit Trails.

# 2. Background

## 2.1. Existing System Analysis

Current solutions in the food delivery market typically fall into two categories:

**1. Aggregator Platforms (e.g., UberEats, DoorDash):**
-   **Advantages**: High visibility, built-in rider network.
-   **Disadvantages**: Significant commission fees (up to 30%), lack of deep customization (limited to "extra cheese" type toggles), and data fragmentation where the restaurant loses direct contact with the customer.
-   **Comparison**: Custom-Bite Suite eliminates commissions and gives the vendor 100% control over their data and ingredient-level logic.

**2. Legacy POS Systems:**
-   **Advantages**: Reliable hardware-software integration.
-   **Disadvantages**: Often lack a dedicated rider interface or customer tracking, making the delivery aspect a "black box" once the food leaves the kitchen. They also tend to have dated, unintuitive user interfaces.
-   **Comparison**: Custom-Bite Suite provides a modern, 360-degree view of the order lifecycle with a premium aesthetic.

## 2.2. Supporting Literatures

The architecture of Custom-Bite Suite is informed by several key paradigms in modern software engineering:

-   **Cross-Platform Performance**: Leveraging React Native allows for a single codebase to reach multiple platforms while maintaining near-native performance for animations and GPS interactions.
-   **Local-First Software**: As advocated by many modern offline-first enthusiasts, utilizing SQLite on-device ensures that the app remains functional in areas with poor connectivity (like building basements or transit zones), synchronizing data across roles in a "monolithic-local" fashion.
-   **Role-Based Access Control (RBAC)**: The system utilizes a formal session and account structure to ensure that managers cannot claim deliveries and riders cannot edit the menu, maintaining the integrity of the business workflow.
-   **Spherical Geometry (Haversine Formula)**: Mathematical models for calculating the "great-circle" distance between two points on a sphere (the Earth) are implemented to provide accurate, real-time logistics data without relying on external, often restricted, API services.
