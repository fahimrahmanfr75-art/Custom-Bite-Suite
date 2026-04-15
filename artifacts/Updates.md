## Authentication Update:
1. each input field must also have the 3D effect.
2. for any wrong information or approach, certain error massage must display in respective places to notify user. it applies for all field that takes input from user.
3. at first users will see the login screen and if the user don't exist then they will be directed to the registration screen and there will be a back button to go back to the login screen. the login screen will have the flexibility that says "Don't have an account? Register" and registration screen will have "Already have an account? Login".
4. remove both address field and delivery notes field from the registration screen and user profile. the address and delivery note will only given during order and it will be connected to that order.
5. when user press an input field, let the screen be dynamic so that the keyboard do not block the visuals under itself. pull the screen up with the keyboard when any input field is triggered. it would be nice to put that specific input field which got triggered to place just above/closer to the keyboard.

## Customer Console update:
### Explore tab:
1. let there be a banner display in explore tab in top offer that will display image of the banner set by the manager. (manager will have the function to set this banner).
2. in the explore tab, within the menu display, follow the concept displayed in 'dish_card_layout.png' image and update all the menu cards accordingly. As you can see all dish will have image of their own and the price that will be shown are the combined price of all the default selected ingrediant. thus, provide restaurant manager the ability to set these in the menu during add,edit,remove of dish from the menu. Also set the database accordingly. if you think more tables are needed and more relations need to be created then do it in your way.
### Dish tab (in menu, within explore tab):
1. when a dish card is pressed and the dish details are displayed with ingrediant selection, i need you to follow the concept in 'dish_tab.png' image and update our app layout in that way. As you can see the selection of ingradiant has changed. there are different types of ingradiant. there are few categories of ingradiant. some ingrediant are fixed with the dish (for those ingradiant, the selecting button will remain inactive. these are mandetory ingradiant. they represent the dish). there are some ingradiant that will by default be selected (these ingradiant are use to make the primary version of the dish), users can unselect them if they want. And then there will be the extra ingradiants as well and real-time price update is also shown. Also you can see in the 'dish_tab.png' image that the review section is integreted inside in the dish tab for all dish and the reviews of other customers are also displayed below that. implement that in our app.
### Account/Profile tab:
1. instead of putting the logout button in the current open place, put it inside account tab. inside account tab place the logout button at the bottom of all the information of user.
2. remove the location and notes info from users account. location info will only be given during order. and there should be no location or notes info displayed in the profile.
### Cart tab:
1. in the cart tab update the logistics, layout of our current approach. follow the concept in 'cart.png' image where each dish is shown with their selected ingrediants and their individual price and cancle approach and a total order cost and total order cancle button. I need you to keep 'delivery notes' input field here but instead of inputing 'delivery address' from keyboard, there will be a button called 'set location', it will open the Map and the customer will have the privilage to select their exact delivery location by using google Map or any map system that modern delivery app use and after selecting their location, when the press 'ok', the location they selected will be preserved for that order and also the addition of delivery fee per order and displaying it.
### Order tab:
1. remove the 'leave review' from order history.
2. all order within 'histroy' will have more descriptive information with them. pressing each card will maximize it and the all information must display including order id, status, individual dish with category wise ingrediant list, individual dish quantity and prize, total prize, the time customer ordered it and if the order is delivered then the time of delivary as well, Rider id of whichever rider was assigned, name, phone, payment status, delivery notes, delivery location in map view.
3. in live tracking, customer will get notification when status gets triggered.
4. when the 'on the way' staus get triggered, then the customer will be able to see the exact location of the delivery person on Map view within live traking filed and where he is, how far he is etc.
5. customer will get the ability to cancle order. customer can no longer cancle the order and the cancelation button will desapere the moment order status reach 'ready'. if order status reach 'ready' then from then the customer can no longer cancle the order. meaning once the food is prepared, then the customer can no longer step back.

## Manager Command Center update:
1. add another tab 'profile' and place the logout button under that tab just like customer console.
2. remove the 'logs' tab and add 'order history instead.
- all orders will be added here, whether the order got rejected or delivered, whether the order got cancled or not, every order will come here at the end. each order will show hyper specific descriptive information. when the cards will be pressed, it will expand and it will show including order id, order status, individual dish with category wise ingrediant list, individual dish quantity and prize, total prize, the time customer ordered it and if the order is delivered then the time of delivary as well, Rider id of whichever rider was assigned, name, phone, payment status, delivery notes, delivery location in map view, customer id, name, phone, email, order date etc.
### Comamnd tab:
1. when a customer places an order, the manager can accept or reject the order. if the manager accepts the order then it will proceed to accepted. if it gets rejected then it will take that status and join order history of both manager side and customer side.
2. manager can advance status only upto 'on_the_way', manager should not have the 'delivered' status tab. when an order reach the 'on_the_way' status, then it goes to the riders. only the riders gets the privilage to place the 'delivered' status on the order. once an order reach 'delivered' status, it gets added with 'Order history' tab for the manager.
3. manager should not have the option to assign rider. remove assign rider option from all cards within manager view.
4. within command tab, the information of the order card needs to change. the priority should be how many dish got ordered and their details such as individual dish name, category wise ingrediant name. total price, payment method status, customer name and customer selected location. and yes, order id included.
### Menu tab:
1. the card view of the menu items should be similar as the customer's view point. that means similar to the concept of 'dish_tab_layout.png' image. Note that, each dish now has image, name, description, category wise ingredient list and their individual prices.
    - In edit mode, manager should be able to edit/change/update each dish image, name, description, ingrediant name, ingrediant price. Note that, there are two types of category, one is menu category and the other is dish wise ingrediant category. it is not mandatory for all dish to have the same sets of category. manager can edit/change/update/delete which dish is uder which category and also manager can add category to the menu and to individual dish and add ingrediant to those category.
    - In add dish mode, manager must follow all the steps i have just mantioned in the previous point.


## Rider Console update:
1. remove the 'map' tab
2. place the logout button under the profile tab just like the customer.
### Assignments tab update:
1. orders will come in this assignments tab only when the restaurant has done preparing the food. that means, when the manager increament the status of an order to 'On_the_way', then that order gets available for the riders to pick up. and since there are lots of riders, whenever an order gets available to ther riders, all riders receive notification and whoever accepts an order, only then the order gets added to their name and display in their 'assignments' tab. and when they finish delivery and presses 'delivered', only then the status of the order updates to 'delivered'.
2. the information of the order card in assignment tab needs to change.
    - the card should display, the location of the customer in map view. the  rider should be able to see real-time updates in the map same as the customer. the rider should be able to see where the customer location is at, where the rider itselt is at, how long is the distance and such, same as how the customer would be able to view.
    - beside that, order id, customer name, phone number, order details(how many order, how many dish(ingrediant wise), total price, payment status).



## Design update:
### Button design update:
All button and every field that acts as a button must follow a same instruction/structure. go to "3D-Button.html" file. Study it. it shows how to create a 3D button using only HTML and CSS. i need you to implement and apply this on our app. every button-like entity/field must have this same interaction.

### Card layout update:
All Card will must follow a same instruction/structure similar to 3D button Below is the documentation of the techniques and styling applied to achieve the result:

1. Structural Setup

- Parent Container: The main card element is set to position: relative to act as a containing block for its absolute positioned children (same as 3D button).
- Layering Strategy: The design uses two distinct layers—a top and a bottom layer—to create 3D depth (same as 3D button).
2. Layer Styling

- Top Layer: Sized to fill the parent container, including text centering, outlines, and border-radius (same as 3D button).
- Bottom Layer: Inherits most styles from the top layer but uses a different background color to emphasize depth. It is set to position: absolute with a top: 10px offset (same as 3D button).
- Base Layer: Created using a pseudo-element of the parent. It is slightly wider, horizontally centered, and given a z-index: -1 to sit behind the card (same as 3D button).
3. Detail & Polish

- Detailing Lines: Pseudo-elements are added to the bottom layer to act as vertical bars on the left and right sides (same as 3D button).
4. Interaction & Animation

- Click Effect: When the card is in the :active state, the top layer uses translateY to move down by 10 pixels, filling the gap to create a "pressed" look. (Note: click effect will only be applied to a card if and only if the card is being used as a button of some sort, otherwise the card will not have any click effect).

- Smoothness: A CSS transition property is applied to the top layer to ensure the click movement is fluid (Note: click effect will only be applied to a card if and only if the card is being used as a button of some sort, otherwise the card will not have any click effect).

- Shine Effect: A skewed rectangle created via a pseudo-element on the top layer is animated to slide across the card on click. The top layer is set to overflow: hidden to ensure the shine is only visible during the animation (Note: click effect will only be applied to a card if and only if the card is being used as a button of some sort, otherwise the card will not have any click effect).
