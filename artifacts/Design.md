## Button design update:
All button and every field that acts as a button must follow a same instruction/structure. go to "3D-Button.html" file. Study it. it shows how to create a 3D button using only HTML and CSS. i need you to implement and apply this on our app. every button-like entity/field must have this same interaction.

## Card layout update:
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
