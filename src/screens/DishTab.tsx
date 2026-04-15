import React, { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, Card3D, Field, commonStyles } from '../components/common';
import { Checkbox } from '../components/Checkbox';
import type { Dish, DishIngredient, OrderItemCustomization, Review, User } from '../types';

export interface DishTabProps {
  dish: Dish;
  onBack: () => void;
  onAddToCart: (customizations: OrderItemCustomization[], quantity: number, instructions: string) => void;
  onSubmitReview: (rating: number, comment: string) => void;
  currentUser: User | null;
  isBusy?: boolean;
}

export function DishTab({
  dish,
  onBack,
  onAddToCart,
  onSubmitReview,
  currentUser,
  isBusy = false,
}: DishTabProps) {
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [selectedCustomizations, setSelectedCustomizations] = useState<OrderItemCustomization[]>([]);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [localReviews, setLocalReviews] = useState<Review[]>(dish.reviews || []);

  // Find if current user has already reviewed this dish
  const userReview = localReviews.find((review) => review.customerId === currentUser?.id);

  // Initialize form with existing user review if available
  React.useEffect(() => {
    if (userReview) {
      setReviewRating(String(userReview.rating));
      setReviewComment(userReview.comment);
    } else {
      setReviewRating('5');
      setReviewComment('');
    }
  }, [userReview]);

  // Calculate total price with selected ingredients
  const calculatedPrice = useMemo(() => {
    const basePrice = dish.price;
    const customizationCost = selectedCustomizations.reduce((sum, c) => sum + c.priceDelta, 0);
    return basePrice + customizationCost;
  }, [dish.price, selectedCustomizations]);

  // Group ingredients by category
  const ingredientsByCategory = useMemo(() => {
    const grouped: Record<string, typeof dish.ingredients> = {};
    (dish.ingredients || []).forEach((ingredient) => {
      const category = ingredient.ingredientCategoryName;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(ingredient);
    });
    return grouped;
  }, [dish.ingredients]);

  // Render star rating
  function renderStars(rating: number): string {
    const filled = Math.round(rating);
    const empty = 5 - filled;
    return '★'.repeat(filled) + '☆'.repeat(empty);
  }

  function handleIngredientToggle(ingredient: DishIngredient) {
    if (ingredient.isMandatory) {
      // Fixed ingredients cannot be toggled
      return;
    }

    if (ingredient.isDefault && !ingredient.isMandatory) {
      // Default selected: remove it
      const isRemoving = !selectedCustomizations.some(
        (item) =>
          item.ingredientId === ingredient.ingredientId && item.action === 'remove'
      );

      if (isRemoving) {
        setSelectedCustomizations((current) => [
          ...current,
          {
            ingredientId: ingredient.ingredientId,
            action: 'remove',
            name: ingredient.name,
            priceDelta: -ingredient.extraPrice,
          },
        ]);
      } else {
        setSelectedCustomizations((current) =>
          current.filter(
            (item) =>
              !(item.ingredientId === ingredient.ingredientId && item.action === 'remove')
          )
        );
      }
    } else {
      // Extra ingredient: add it
      const isAdding = !selectedCustomizations.some(
        (item) =>
          item.ingredientId === ingredient.ingredientId && item.action === 'add'
      );

      if (isAdding) {
        setSelectedCustomizations((current) => [
          ...current,
          {
            ingredientId: ingredient.ingredientId,
            action: 'add',
            name: ingredient.name,
            priceDelta: ingredient.extraPrice,
          },
        ]);
      } else {
        setSelectedCustomizations((current) =>
          current.filter(
            (item) =>
              !(item.ingredientId === ingredient.ingredientId && item.action === 'add')
          )
        );
      }
    }
  }

  function handleAddToCart() {
    onAddToCart(selectedCustomizations, quantity, instructions);
  }

  function handleSubmitReview() {
    if (!currentUser) return;

    setIsSubmittingReview(true);
    try {
      const rating = Math.min(5, Math.max(1, Number(reviewRating) || 5));
      
      // Call the parent handler to persist to database
      onSubmitReview(rating, reviewComment);

      // Update local reviews immediately for real-time display
      if (userReview) {
        // Update existing review
        setLocalReviews((current) =>
          current.map((review) =>
            review.customerId === currentUser.id
              ? {
                  ...review,
                  rating,
                  comment: reviewComment,
                  createdAt: new Date().toISOString(),
                }
              : review
          )
        );
      } else {
        // Add new review
        const newReview: Review = {
          id: Math.floor(Math.random() * 100000), // Temporary ID
          dishId: dish.id,
          customerId: currentUser.id,
          customerName: `${currentUser.firstName} ${currentUser.lastName}`,
          rating,
          comment: reviewComment,
          createdAt: new Date().toISOString(),
        };
        setLocalReviews((current) => [newReview, ...current]);
      }

      // Reset form only for new reviews, not edits
      if (!userReview) {
        setReviewRating('5');
        setReviewComment('');
      }
    } finally {
      setIsSubmittingReview(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
          {/* Header with back button */}
          <View style={styles.header}>
            <AppButton label="← Back" variant="ghost" onPress={onBack} />
            {/* <Text style={styles.title}>{dish.name}</Text> */}
            <View style={{ width: 80 }} />
          </View>

          {/* CARD 1: Dish Details */}
          <Card3D style={styles.dishDetailsCard}>
            {/* Large dish image */}
            <View style={styles.imageContainer}>
              {dish.imageUrl ? (
                <Image
                  source={{ uri: dish.imageUrl }}
                  style={styles.dishImage}
                  resizeMode="cover"
                  accessibilityLabel={dish.name}
                />
              ) : (
                <View style={[styles.dishImage, styles.dishImagePlaceholder]} />
              )}
            </View>

            {/* Dish name and description */}
            <View style={styles.dishInfo}>  
              <Text style={styles.title}>{dish.name}</Text>
              <Text style={styles.dishDescriptionText}>{dish.description}</Text>
              <Text style={styles.dishMeta}>
                {dish.spiceLevel} spice • {dish.prepTimeMinutes} min • {dish.calories} kcal
              </Text>
              <View style={styles.ratingRow}>
                <Text style={styles.stars}>
                  {renderStars(dish.averageRating)} {dish.averageRating.toFixed(1)} ({dish.reviewCount} reviews)
                </Text>
              </View>
            </View>

            {/* Special instructions input */}
            <View style={styles.instructionsSection}>
              <Field
                label="Special instructions (optional)"
                value={instructions}
                onChangeText={setInstructions}
                placeholder="Special requests or allergies..."
                multiline
              />
            </View>

            {/* Ingredients Customization */}
            {Object.keys(ingredientsByCategory).length > 0 && (
              <View style={styles.ingredientsSection}>
                <Text style={styles.sectionSubtitle}>Customize Your Dish</Text>

                {Object.entries(ingredientsByCategory).map(([categoryName, ingredients]) => (
                  <View key={categoryName} style={styles.categoryGroup}>
                    <Text style={styles.categoryTitle}>{categoryName}</Text>

                    {ingredients.map((ingredient) => {
                      // Determine if checkbox should be disabled
                      const isDisabled = ingredient.isMandatory;
                      
                      // Determine actual checked state based on ingredient type
                      let actualChecked = false;
                      if (ingredient.isMandatory) {
                        actualChecked = true; // Fixed ingredients always checked
                      } else if (ingredient.isDefault && !ingredient.isMandatory) {
                        // Default selected: check if it's NOT being removed
                        actualChecked = !selectedCustomizations.some(
                          (item) =>
                            item.ingredientId === ingredient.ingredientId && item.action === 'remove'
                        );
                      } else {
                        // Extras: check if it's being added
                        actualChecked = selectedCustomizations.some(
                          (item) =>
                            item.ingredientId === ingredient.ingredientId && item.action === 'add'
                        );
                      }

                      return (
                        <Pressable
                          key={`${ingredient.ingredientId}-${ingredient.ingredientCategoryName}`}
                          style={styles.ingredientRow}
                          onPress={() => {
                            if (!isDisabled) {
                              handleIngredientToggle(ingredient);
                            }
                          }}
                        >
                          <View style={styles.ingredientLeft}>
                            <Checkbox
                              value={actualChecked}
                              onValueChange={() => {
                                if (!isDisabled) {
                                  handleIngredientToggle(ingredient);
                                }
                              }}
                              disabled={isDisabled}
                              color="#D45D31"
                            />
                            <View style={styles.ingredientNameInfo}>
                              <Text style={styles.ingredientName}>{ingredient.name}</Text>
                            </View>
                          </View>
                          <Text style={styles.ingredientPrice}>
                            ${ingredient.extraPrice.toFixed(2)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            {/* Quantity and price section */}
            <View style={styles.orderSummary}>
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.quantityControl}>
                  <AppButton
                    label="−"
                    variant="ghost"
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  />
                  <Text style={styles.quantityValue}>{quantity}</Text>
                  <AppButton
                    label="+"
                    variant="ghost"
                    onPress={() => setQuantity(quantity + 1)}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>Total</Text>
                <Text style={styles.totalPrice}>${(calculatedPrice * quantity).toFixed(2)}</Text>
                <Text style={styles.priceBreakdown}>
                  (${calculatedPrice.toFixed(2)} × {quantity})
                </Text>
              </View>

              <View style={styles.centeredAction}>
                <View style={styles.centeredButtonWrap}>
                  <AppButton
                    label={isBusy ? 'Adding to cart...' : 'Add to cart'}
                    onPress={handleAddToCart}
                    disabled={isBusy}
                  />
                </View>
              </View>
            </View>
          </Card3D>

          {/* CARD 2: Reviews Section */}
          <Card3D style={styles.reviewsCard}>
            <Text style={styles.sectionSubtitle}>Reviews</Text>

            {/* Review submission card */}
            <View style={styles.reviewSubmitContainer}>
              <Text style={styles.reviewLabel}>Rate this dish</Text>
              <View style={styles.starRatingInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setReviewRating(String(star))}
                    style={styles.starButton}
                  >
                    <Text style={[styles.starIcon, { color: star <= Number(reviewRating) ? '#FFD700' : '#DDD' }]}>
                      ★
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.reviewLabel}>Write something</Text>
              <Field
                label=""
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Share your experience..."
                multiline
              />

              <View style={styles.centeredAction}>
                <View style={styles.centeredButtonWrap}>
                  <AppButton
                    label={isSubmittingReview ? 'Submitting...' : 'Submit review'}
                    variant="secondary"
                    onPress={handleSubmitReview}
                    disabled={isSubmittingReview || !reviewComment.trim()}
                  />
                </View>
              </View>
            </View>

            {/* Existing reviews display */}
            {localReviews && localReviews.length > 0 ? (
              <View style={styles.reviewsList}>
                <Text style={styles.reviewsCountLabel}>{localReviews.length} reviews</Text>
                {localReviews.map((review: Review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewerName}>{review.customerName}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.reviewRating}>{renderStars(review.rating)}</Text>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[commonStyles.mutedText, { textAlign: 'center', marginVertical: 16 }]}>
                No reviews yet. Be the first to review!
              </Text>
            )}
          </Card3D>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F2EDE2',
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#0F2529',
    fontSize: 20,
    fontWeight: '700',
    // textAlign: 'center',
    flex: 1,
  },

  /* CARD 1: Dish Details Card */
  dishDetailsCard: {
    padding: 16,
    gap: 16,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  dishImage: {
    backgroundColor: '#E3DACA',
    aspectRatio: 16 / 9,
  },
  dishImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishInfo: {
    gap: 8,
  },
  dishDescriptionText: {
    color: '#56707B',
    fontSize: 14,
    lineHeight: 20,
  },
  dishMeta: {
    color: '#8A9BA8',
    fontSize: 12,
  },
  ratingRow: {
    marginVertical: 4,
  },
  stars: {
    color: '#D45D31',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Instructions Section */
  instructionsSection: {
    marginTop: 8,
  },

  /* Ingredients Customization */
  ingredientsSection: {
    marginTop: 8,
    gap: 12,
  },
  sectionSubtitle: {
    color: '#0F2529',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryGroup: {
    gap: 8,
  },
  categoryTitle: {
    color: '#56707B',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFFBF2',
    borderColor: '#000000',
    borderWidth: 1,
  },
  ingredientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ingredientNameInfo: {
    gap: 4,
    flex: 1,
  },
  ingredientName: {
    color: '#0F2529',
    fontSize: 13,
    fontWeight: '500',
  },
  ingredientPrice: {
    color: '#D45D31',
    fontSize: 13,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },

  /* Order Summary */
  orderSummary: {
    gap: 12,
    marginTop: 8,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    color: '#0F2529',
    fontSize: 20,
    fontWeight: '600',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityValue: {
    color: '#0F2529',
    fontSize: 15,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  divider: {
    backgroundColor: '#D1C8B8',
    height: 1,
  },
  priceSection: {
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    color: '#56707B',
    fontSize: 20,
  },
  totalPrice: {
    color: '#D45D31',
    fontSize: 22,
    fontWeight: '700',
  },
  priceBreakdown: {
    color: '#8A9BA8',
    fontSize: 11,
  },

  /* CARD 2: Reviews Card */
  reviewsCard: {
    padding: 16,
    gap: 12,
  },
  reviewSubmitContainer: {
    borderColor: '#000000',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  reviewLabel: {
    color: '#0F2529',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  starRatingInput: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 6,
  },
  starIcon: {
    fontSize: 34,
  },
  reviewsList: {
    gap: 10,
  },
  reviewsCountLabel: {
    color: '#56707B',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewItem: {
    borderColor: '#000000',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    backgroundColor: '#FFFBF2',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reviewerAvatar: {
    backgroundColor: '#D1C8B8',
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  reviewerName: {
    color: '#0F2529',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewDate: {
    color: '#000000',
    fontSize: 10,
    marginTop: 2,
  },
  reviewRating: {
    color: '#D45D31',
    fontSize: 11,
    fontWeight: '600',
  },
  reviewComment: {
    color: '#56707B',
    fontSize: 12,
    lineHeight: 16,
  },
  centeredAction: {
    alignItems: 'center',
  },
  centeredButtonWrap: {
    alignSelf: 'center',
  },
});

