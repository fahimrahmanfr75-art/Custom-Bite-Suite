# Title: SOFTWARE DEVELOPMENT APPROACH SELECTION

## 1. Objective

To evaluate, select, and justify the most appropriate software development methodology for the project titled **"Custom-Bite Suite — A Single-Vendor Multi-Role Food Delivery Management Platform."** This report examines the project's unique characteristics — including its multi-role architecture (Customer, Manager, Rider), local-only SQLite data layer, ingredient-level dish customization engine, real-time GPS-based rider tracking, and iterative UI/UX refinement requirements — to determine which development approach offers the optimal balance of flexibility, quality, speed-to-delivery, and stakeholder responsiveness. The objective extends beyond merely naming a methodology; it provides a thorough rationale grounded in the project's actual scope, technical complexity, team structure, and client feedback patterns, demonstrating a deep understanding of how software process models influence the success of real-world engineering projects.

## 2. Theory/Background

A **Software Development Approach** (also called a Software Development Life Cycle model or Software Process Model) is a structured framework that defines the sequence of activities, deliverables, roles, and decision points involved in transforming a set of requirements into a working software system. The choice of development approach fundamentally shapes how a project is planned, executed, tested, and delivered — it determines how requirements are gathered, how changes are accommodated, how quality is assured, and how frequently stakeholders see working software.

The major software development approaches include:

**1. Waterfall Model:**
The Waterfall model is the oldest and most linear software development approach. It organizes the development process into a strict sequence of non-overlapping phases: Requirements → Design → Implementation → Testing → Deployment → Maintenance. Each phase must be fully completed before the next one begins, and there is no formal mechanism for returning to a previous phase. The Waterfall model works best for projects with well-understood, stable requirements that are unlikely to change — such as regulatory compliance systems, embedded firmware for medical devices, or government contract deliverables with fixed specifications. However, for projects where requirements evolve based on user feedback, market research, or technical discovery, the Waterfall model's rigidity becomes a significant liability. Late-stage requirement changes are extremely costly because they cascade backward through all completed phases, requiring re-design, re-implementation, and re-testing.

**2. V-Model (Verification and Validation Model):**
The V-Model extends the Waterfall approach by explicitly pairing each development phase with a corresponding testing phase, forming a V-shaped diagram. Requirements analysis maps to acceptance testing; system design maps to system testing; architectural design maps to integration testing; and module design maps to unit testing. This model emphasizes early test planning and traceability between requirements and test cases. While it improves quality assurance over the basic Waterfall model, it inherits the same fundamental limitation: it assumes requirements are stable and fully known upfront, making it poorly suited for projects with evolving or discovery-driven requirements.

**3. Iterative and Incremental Model:**
This approach breaks the project into smaller cycles (iterations), each of which produces a working increment of the system. Unlike Waterfall, it allows revisiting and refining earlier work in subsequent iterations. Each iteration follows a mini-lifecycle of planning, design, implementation, and testing. The system grows incrementally as new features, screens, and capabilities are added in each cycle. This model is valuable when the core architecture is understood but the full feature set evolves over time — which closely matches the development reality of Custom-Bite Suite, where the authentication system, menu browsing, and cart management were delivered first, followed by manager dashboard, rider tracking, order history, and live tracking in subsequent iterations.

**4. Spiral Model:**
The Spiral model combines iterative development with systematic risk management. Each cycle through the spiral involves four phases: objective setting, risk assessment, development/testing, and planning for the next iteration. It is particularly well-suited for large, high-risk projects where significant technical or business uncertainties exist. While the risk-awareness aspect is valuable, the Spiral model's formal risk analysis overhead can be excessive for smaller, single-team projects.

**5. Agile Methodology (Scrum):**
Agile is a family of iterative, incremental development methodologies that prioritize: individuals and interactions over processes and tools, working software over comprehensive documentation, customer collaboration over contract negotiation, and responding to change over following a plan. **Scrum** is the most widely adopted Agile framework, organizing work into fixed-length iterations called **Sprints** (typically 1–4 weeks), with defined roles (Product Owner, Scrum Master, Development Team), ceremonies (Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective), and artifacts (Product Backlog, Sprint Backlog, Increment). Scrum excels in environments where requirements are expected to change frequently, stakeholder feedback drives prioritization, and the team needs to deliver working software at regular intervals.

**6. RAD (Rapid Application Development):**
RAD emphasizes rapid prototyping and iterative delivery with minimal upfront planning. It focuses on quickly building working prototypes that stakeholders can evaluate, with the expectation that the prototype evolves into the final product through successive refinements. RAD works well for UI-heavy applications where visual feedback is critical, but it can lead to technical debt if the prototyping speed comes at the expense of architectural soundness.

**7. DevOps / Continuous Delivery:**
DevOps is not a development methodology per se but a set of practices that integrate development and operations, emphasizing continuous integration (CI), continuous delivery (CD), automated testing, and infrastructure-as-code. DevOps practices complement Agile methodologies by automating the build-test-deploy pipeline, enabling rapid and reliable releases. For mobile applications like Custom-Bite Suite, DevOps practices manifest as automated APK builds, CI test execution, and streamlined release processes.

---

## 3. Selected Model and Justification

### 3.1 Selected Model: Agile (Scrum) with Iterative Incremental Delivery

The selected software development approach for the Custom-Bite Suite project is the **Agile methodology using the Scrum framework**, combined with **Iterative Incremental Delivery** principles. Agile Scrum is an adaptive, team-based process model that organizes software development into time-boxed iterations (Sprints), each producing a potentially shippable increment of the product. The Scrum framework provides structure through defined roles, ceremonies, and artifacts while preserving the flexibility to respond to changing requirements, user feedback, and technical discoveries at the end of every sprint cycle.

In the context of Custom-Bite Suite, the Agile Scrum approach manifests as follows:

- **Sprint Duration**: 1–2 week sprints, each focused on delivering a complete, testable feature increment (e.g., Sprint 1: Authentication system → Sprint 2: Customer menu and cart → Sprint 3: Manager dashboard → Sprint 4: Rider console → Sprint 5: Live tracking and order history → Sprint 6: UI/UX overhaul and polish).
- **Product Backlog**: A prioritized list of all desired features, drawn from the project's functional requirements (FR-01 through FR-16), organized by business value and technical dependency.
- **Sprint Backlog**: A subset of backlog items committed to for each sprint, with each item broken into implementable tasks (e.g., "Create SQLite schema for orders table", "Implement advanceOrder function with status validation", "Build ManagerDashboard kitchen status view with filter pills").
- **Increment**: At the end of each sprint, a working, deployable version of the application that can be installed on an Android device and demonstrated to stakeholders.
- **Sprint Review**: A demonstration of the completed increment to stakeholders (academic supervisors, peers, or simulated clients) to gather feedback that informs the next sprint's priorities.
- **Sprint Retrospective**: A team reflection on what worked well, what didn't, and what should be improved in the next sprint's process.

### 3.2 Reason for selecting this particular approach:

The Agile Scrum methodology was selected for the Custom-Bite Suite project based on the following project-specific characteristics that align directly with Agile's core strengths:

**1. Evolving and Discovery-Driven Requirements:**
The Custom-Bite Suite project's requirements were not fully defined upfront. The initial scope focused on a basic food ordering application, but as development progressed, significant new requirements emerged organically: ingredient-level dish customization with mandatory/default/optional ingredient types, a multi-category curated fine-dining menu (replacing the original fast-food concept), a comprehensive audit logging system, GPS-based live rider tracking with Haversine formula ETA calculations, expandable order history cards with ingredient snapshots, a promotional banner management system, and a complete "Onyx & Ember" UI/UX overhaul. These evolving requirements would have caused catastrophic rework in a Waterfall model but were naturally accommodated within Scrum's sprint-based adaptation cycle.

**2. Multi-Role System Complexity Demands Incremental Delivery:**
Custom-Bite Suite serves three distinct user roles (Customer, Manager, Rider), each with its own dashboard, feature set, and interaction patterns. Building all three roles simultaneously would create an unmanageable scope. Agile's incremental approach allowed the team to fully implement, test, and stabilize one role's features before moving to the next, ensuring that the authentication system (shared by all roles) was robust before role-specific dashboards were built on top of it.

**3. Frequent UI/UX Iteration Based on Visual Feedback:**
The project underwent multiple significant visual changes — from an initial basic layout to a "3D card" neomorphic design to the final "Onyx & Ember" dark-mode glassmorphic theme. These design iterations were driven by visual feedback and aesthetic evaluation, which is impossible to predict during an upfront specification phase. Agile's Sprint Review ceremony provided natural checkpoints where the visual design could be evaluated and redirected.

**4. Technical Architecture Uncertainty:**
Several technical decisions — such as the serialized snapshot loading strategy to avoid SQLite concurrency issues, the ingredient snapshot mechanism for preserving order-time ingredient compositions, and the optimistic locking pattern for rider delivery claims — emerged from technical experimentation during development rather than upfront design. Agile's empirical process control model (inspect and adapt) supported this technical learning process.

**5. Single-Developer Team Efficiency:**
For a small team (or solo developer), Scrum's lightweight ceremony overhead (brief sprint planning, daily self-check, sprint review, retrospective) provides just enough structure to maintain discipline and track progress without the excessive documentation burden of Waterfall or the formal risk analysis overhead of the Spiral model.

**6. Mobile Application Development Best Practice:**
The mobile app development industry has overwhelmingly adopted Agile methodologies because mobile apps require rapid iteration cycles, frequent user testing on real devices, platform-specific bug fixes, and responsive adaptation to OS updates and device fragmentation. Custom-Bite Suite's build-test-fix cycles (including resolving APK bundling issues, fixing screen overflow layouts, and optimizing for mobile responsiveness) are naturally aligned with Agile sprints.

### 3.3 What made you think that this particular approach is better than other approaches: (advantages and disadvantages of this approach)

**Advantages of Agile Scrum for Custom-Bite Suite:**

| # | Advantage | How It Applies to Custom-Bite Suite |
|---|-----------|-------------------------------------|
| 1 | **Embraces Changing Requirements** | The project evolved from a basic fast-food ordering app to a fine-dining platform with 16 curated dishes, 8 categories, multi-level ingredient customization, and a premium UI. Scrum's change-friendly nature accommodated these pivots without project restart. |
| 2 | **Delivers Working Software Frequently** | Each sprint produced a deployable Android APK that could be installed and tested on a real device. Stakeholders could see tangible progress every 1–2 weeks rather than waiting months for a "big bang" delivery. |
| 3 | **Early and Continuous Risk Discovery** | Technical risks (SQLite concurrency, APK bundling failures, GPS permission handling, image loading failures) were discovered and resolved incrementally in the sprint where the affected feature was built, rather than surfacing as a catastrophic integration failure at the end. |
| 4 | **Supports Iterative UI/UX Refinement** | The application's visual design went through at least 3 major iterations (basic → neomorphic 3D → Onyx & Ember dark mode). Each iteration was evaluated at a sprint boundary, with feedback driving the next design cycle. |
| 5 | **Prioritization by Business Value** | Scrum's Product Backlog allowed the team to prioritize customer-facing features (menu, cart, ordering) over back-office features (audit logs, manager history) and cosmetic polish (banner system, animated carousel), ensuring the highest-value features were delivered first. |
| 6 | **Built-In Quality Through Sprint Testing** | Each sprint included testing within the sprint itself, ensuring that bugs were caught and fixed while the feature code was still fresh in the developer's mind, rather than in a separate testing phase weeks or months later. |
| 7 | **Transparency and Progress Visibility** | The sprint-based delivery model provided clear visibility into project progress. Completed sprints represented verified, working functionality — not work-in-progress estimates. |
| 8 | **Minimal Documentation Overhead** | Agile values working software over comprehensive documentation, which aligned with the project's focus on a functional, polished application rather than exhaustive specification documents. Documentation (SRS, project report, risk management) was produced as needed rather than as a prerequisite to coding. |

**Disadvantages of Agile Scrum (and how they were mitigated in Custom-Bite Suite):**

| # | Disadvantage | How It Was Mitigated |
|---|-------------|---------------------|
| 1 | **Scope Creep Risk** — Agile's openness to change can lead to an ever-expanding scope where new features are continuously added without completing existing ones. | Mitigated by maintaining a disciplined Product Backlog with clear sprint goals. Each sprint had a defined scope (e.g., "Complete rider dashboard with GPS tracking") that was locked at sprint planning. New ideas discovered mid-sprint were added to the backlog for future sprints, not injected into the current sprint. |
| 2 | **Requires Active Stakeholder Engagement** — Scrum assumes regular stakeholder availability for sprint reviews and backlog refinement, which may not always be possible. | Mitigated by using asynchronous feedback mechanisms: visual screenshots, recorded demo videos, and artifact documents (PROJECT_REPORT.md, walkthrough.md) were produced after each major sprint for stakeholders who couldn't attend synchronous reviews. |
| 3 | **Less Upfront Predictability** — Unlike Waterfall, Agile does not produce a comprehensive upfront plan with fixed delivery dates for all features. | Mitigated by creating a high-level release roadmap identifying major milestones (MVP with auth + customer ordering → Manager features → Rider features → Polish sprint) while keeping sprint-level planning flexible. |
| 4 | **Technical Debt Accumulation** — Rapid Agile iterations can prioritize feature delivery over architectural quality, leading to accumulated technical debt. | Mitigated by dedicating specific sprints to refactoring and cleanup. The UI/UX overhaul sprint (migrating to Onyx & Ember theme) also served as a code cleanup opportunity, consolidating shared components into `common.tsx` and standardizing the design system. The repository layer (`repository.ts`) was continuously refactored to use exclusive transactions and proper error handling. |
| 5 | **Documentation Can Be Neglected** — Agile's emphasis on working software can lead to insufficient documentation. | Mitigated by producing comprehensive documentation artifacts in the final sprints: SRS document (`Preparation_Of_SRS_Document.md`), Project Report (`PROJECT_REPORT.md`), Risk Management report, deployment guide, and flow diagrams. |

**Comparison with Rejected Alternatives:**

| Approach | Why It Was Rejected for Custom-Bite Suite |
|----------|------------------------------------------|
| **Waterfall** | Requirements evolved significantly throughout development (fast-food → fine-dining, basic UI → glassmorphic theme, no tracking → GPS live tracking). Waterfall's sequential, non-reversible phases would have required restarting the entire lifecycle after each major scope change. The cost of late-stage changes in Waterfall is prohibitively high for an evolving project like this. |
| **V-Model** | While the V-Model's emphasis on early test planning is valuable, it shares Waterfall's assumption of stable, upfront requirements. Custom-Bite Suite's test strategy evolved alongside the features — test cases for ingredient customization, for example, couldn't be written until the ingredient data model was designed, which happened during the implementation sprint. |
| **Spiral** | The Spiral model's formal risk analysis phase at each iteration would add excessive overhead for a single-team project. While risk awareness is important (as demonstrated in the Risk Management lab), the formal structure of the Spiral model is better suited for large, multi-team enterprise projects with significant financial stakes. |
| **RAD** | RAD's prototype-driven approach could lead to a technically fragile application. Custom-Bite Suite's complex data layer (2,294 lines of repository code, 13 database tables, exclusive transactions, schema migrations) required careful architectural planning that goes beyond RAD's "build fast, fix later" philosophy. |

### 3.4 How will your development team and client be benefited by following this approach?:

**Benefits to the Development Team:**

1. **Reduced Cognitive Overload**: By focusing on one feature area per sprint (e.g., "this sprint is for the Manager Command Center"), the developer can deeply concentrate on a bounded problem domain rather than context-switching across the entire system. During the rider dashboard sprint, for instance, the developer could focus exclusively on GPS integration, Haversine calculations, and delivery card UI without distraction from menu management or refund processing.

2. **Continuous Integration of Learning**: Agile's inspect-and-adapt cycle allowed the team to incorporate technical lessons learned in earlier sprints into later ones. For example, the serialized snapshot loading strategy (discovered during the customer dashboard sprint to avoid SQLite concurrency issues) was applied proactively to the manager and rider dashboards. The exclusive transaction pattern (`withExclusiveTransactionAsync`) first used for order placement was consistently applied to dish upsert and schema migration operations.

3. **Manageable Debugging and Testing**: Because each sprint delivers a small, well-defined increment, bugs can be isolated to the code written during that sprint. When the APK build failed on real Android devices (due to missing JavaScript bundle), the issue was immediately traceable to the current sprint's build configuration changes rather than buried in months of accumulated code.

4. **Psychological Momentum**: Delivering a working, installable application at the end of every sprint provides tangible evidence of progress, combating the demotivation that can occur in Waterfall projects where weeks of work produce no visible output.

5. **Architectural Flexibility**: The team was able to make significant architectural decisions incrementally — the decision to use a single `AppContext` for state management, the repository pattern for SQLite access, the snapshot-based data loading model, and the ingredient category/ingredient two-tier customization schema all emerged through iterative refinement rather than requiring a rigid upfront architectural specification.

**Benefits to the Client (Stakeholders/Academic Supervisors):**

1. **Early and Frequent Visibility**: The client received working demonstrations at regular intervals, allowing them to verify that the project was proceeding in the right direction. If the client wanted more emphasis on financial reporting or less emphasis on visual polish, they could communicate that preference and see it reflected in the very next sprint.

2. **Influence Over Prioritization**: The client could directly influence which features were built next by providing input during backlog refinement. When the requirement for expandable order history with ingredient snapshots was identified, it was added to the backlog and prioritized for the next available sprint.

3. **Reduced Delivery Risk**: Because Every sprint produces a working increment, the client always has a functional version of the software, even if the project is terminated early. After Sprint 3 (out of 6), the client already had a fully functional application with authentication, customer ordering, and manager order processing — a usable product in its own right.

4. **Quality Assurance Through Iteration**: Each sprint's output is tested and validated before the next sprint begins, meaning the client receives an incrementally more polished and reliable product. By the final sprint, the application had been through 6 cycles of build-test-fix, resulting in a significantly more stable and robust product than a single Waterfall pass would produce.

5. **Documentation Aligned with Implementation**: Because documentation is produced iteratively alongside the code, the client receives documents (SRS, project report, risk assessment) that accurately reflect the actual implemented system rather than aspirational specifications that may diverge from reality.

### 3.5 Online Tool you are using for project management: [Any online tools (e.g., Trello, Jira)]

The following online tools are used for project management, collaboration, and development workflow:

| Tool | Purpose | How It Is Used in Custom-Bite Suite |
|------|---------|-------------------------------------|
| **GitHub** | Version Control and Code Repository | All source code, configuration files, and documentation artifacts are tracked in a Git repository. GitHub provides commit history (acting as a sprint-level changelog), branch management for feature development, pull request workflows for code review, and issue tracking for bug reports and feature requests. Each sprint's work is represented by a series of commits with descriptive messages, providing full traceability from requirement to implementation. |
| **Trello** | Agile Board and Backlog Management | A Trello board is used to manage the Product Backlog and Sprint Boards using the Kanban-style column layout: **Backlog** (all identified features and tasks), **To Do** (items committed for the current sprint), **In Progress** (actively being worked on), **Testing** (feature complete, undergoing verification), and **Done** (completed, tested, and merged). Each Trello card represents a user story or task (e.g., "As a manager, I want to view expandable order history cards with ingredient snapshots"), with checklists for sub-tasks, labels for risk category, and due dates for sprint boundaries. |
| **Android Studio / Expo CLI** | Build and Deployment Pipeline | Android Studio's Gradle-based build system and Expo CLI are used to compile, bundle, and generate release APK artifacts. A custom build script (`build_release_apk.bat`) automates the release build process, ensuring consistent and reproducible deployments. |
| **VS Code with Gemini AI** | Integrated Development Environment | Visual Studio Code serves as the primary IDE, with Gemini AI (Antigravity) providing AI-assisted pair programming for code generation, debugging, architectural consultation, documentation writing, and comprehensive project analysis. |

---

## 6. Conclusion

The **Agile (Scrum) methodology** provides the flexibility and structure needed for the successful development of the Custom-Bite Suite. The iterative approach ensures that the project evolves based on feedback and changing requirements, while the Scrum framework provides clear roles, ceremonies, and artifacts to guide the development process.

Throughout the development of Custom-Bite Suite, the Agile Scrum approach proved its value at every critical juncture: when the project scope expanded from a basic food ordering app to a comprehensive fine-dining platform with ingredient-level customization, Scrum's sprint-based reprioritization absorbed the change without project disruption. When the UI/UX direction shifted from a basic layout to a premium "Onyx & Ember" glassmorphic theme, the sprint review ceremony provided the natural feedback loop that drove the redesign. When technical challenges emerged — SQLite concurrency issues, APK bundling failures on real devices, GPS permission handling complexities — Scrum's inspect-and-adapt cycle allowed the team to diagnose, resolve, and learn from each challenge within the sprint where it was discovered.

The project's final deliverable — a fully functional, Android-deployable mobile application with 16 curated dishes, 3 role-specific dashboards, 13 database tables, 2,294 lines of data access logic, GPS-based live tracking, ingredient snapshot preservation, financial dashboards, refund processing, audit logging, and a polished 3D-layered UI design system — stands as empirical evidence that the Agile Scrum methodology, when applied with discipline and purpose, can deliver complex, production-grade software through disciplined incremental development. The combination of Agile's adaptive planning with Scrum's structural ceremonies ensured that every sprint produced measurable progress, every stakeholder review yielded actionable feedback, and every technical risk was surfaced and addressed before it could threaten the project's overall success.
