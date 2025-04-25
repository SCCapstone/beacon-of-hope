import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Meal,
  Food,
  Ingredient,
  MealRecommendation,
  NutritionalInfo,
  NutritionalGoals,
  VisualizationLevel,
  COLOR_SCHEMES,
} from "../types";
import { format, isValid } from "date-fns";
import { FoodTypeIcon } from "./FoodTypeIcon";
import { formatScore } from "../utils";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface MealDetailsPanelProps {
  meal: Meal | null; // Parent trace meal (if selected)
  food: Food | null; // Selected food item
  ingredient: Ingredient | null; // Selected ingredient item
  recommendation: MealRecommendation | null; // Parent recommendation (if selected)
  onClose: () => void;
  nutritionalGoals: NutritionalGoals | null; // Accept null
  currentNutritionalValues: {
    // Values for the day (potentially simulated)
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
  };
  baseNutritionalValues: {
    // Base values before simulation
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
  };
  selectedDate: Date;
  currentLevel: VisualizationLevel["type"];
  // Add callbacks for actions if needed later
  // onFavoriteToggle?: (mealId: string) => void;
}

const DetailHeader: React.FC<{
  title: string;
  subtitle?: string;
  isRecommendation?: boolean;
  isTraceMeal?: boolean;
  isFavorited?: boolean;
  onClose: () => void;
  // onFavoriteClick?: () => void; // Optional favorite handler
}> = ({
  title,
  subtitle,
  isRecommendation,
  isTraceMeal,
  isFavorited,
  onClose,
  // onFavoriteClick,
  // isFavorited
}) => (
  <div className="p-4 border-b border-[#E0E0E0] bg-[#FEF9F0] relative">
    {" "}
    {/* Lighter cream bg, neutral border */}
    {isRecommendation && (
      <span className="absolute top-2 left-2 bg-[#5CB85C]/20 text-[#3C763D] px-2 py-0.5 rounded-full text-xs font-medium z-10">
        {" "}
        {/* Accent Green light */}
        Recommended
      </span>
    )}
    {/* Close Button */}
    <button
      onClick={onClose}
      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full z-10"
      aria-label="Close details"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
    {/* Favorite Button for Trace Meals */}
    {isTraceMeal && (
      <button
        // onClick={onFavoriteClick} // Not implemented
        onClick={() => console.warn("Favorite click not implemented in panel")}
        className="absolute top-2 right-10 p-1 text-[#FFC107] hover:text-[#FFA000] hover:bg-gray-100 rounded-full z-10" // Accent Yellow
        aria-label={isFavorited ? "Unfavorite meal" : "Favorite meal"}
        title={
          isFavorited
            ? "Favorited (Click to Unfavorite - Not Implemented)"
            : "Favorite (Not Implemented)"
        }
      >
        {/* Use isFavorited prop to show solid or outline star */}
        {isFavorited ? (
          <StarIconSolid className="w-5 h-5" />
        ) : (
          <StarIconOutline className="w-5 h-5" />
        )}
      </button>
    )}
    <h3 className="text-lg font-semibold text-gray-800 mt-4 pr-16">{title}</h3>{" "}
    {/* Added padding-right */}
    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
  </div>
);

const NutritionalBreakdown: React.FC<{
  info: NutritionalInfo | undefined;
  impact?: MealRecommendation["nutritionalImpact"];
}> = ({ info, impact }) => {
  if (!info) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Nutritional information not available.
      </div>
    );
  }

  const formatImpact = (value: number | undefined): string => {
    if (value === undefined || value === 0) return "";
    const prefix = value > 0 ? "+" : "";
    return ` (${prefix}${value.toFixed(0)})`; // Show impact as integer
  };

  const formatValue = (
    value: number | null | undefined,
    unit: string = "",
    precision: number = 0
  ): string => {
    if (value === null || value === undefined) return "N/A";
    return `${value.toFixed(precision)}${unit}`;
  };

  return (
    <div className="p-4 border-b border-[#E0E0E0]">
      {/* Neutral border */}
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Nutritional Information
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex justify-between">
          <span>Calories:</span>{" "}
          <span className="font-medium text-gray-800">
            {formatValue(info.calories)}
            {impact && (
              <span
                className={
                  impact.calories > 0
                    ? "text-[#5CB85C]"
                    : impact.calories < 0
                    ? "text-[#D9534F]"
                    : "text-gray-500"
                }
              >
                {/* Accent Green/Red */}
                {formatImpact(impact.calories)}
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Protein:</span>{" "}
          <span className="font-medium text-gray-800">
            {formatValue(info.protein, "g")}
            {impact && (
              <span
                className={
                  impact.protein > 0
                    ? "text-[#5CB85C]"
                    : impact.protein < 0
                    ? "text-[#D9534F]"
                    : "text-gray-500"
                }
              >
                {" "}
                {/* Accent Green/Red */}
                {formatImpact(impact.protein)}g
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Carbs:</span>{" "}
          <span className="font-medium text-gray-800">
            {formatValue(info.carbs, "g")}
            {impact && (
              <span
                className={
                  impact.carbs > 0
                    ? "text-[#5CB85C]"
                    : impact.carbs < 0
                    ? "text-[#D9534F]"
                    : "text-gray-500"
                }
              >
                {" "}
                {/* Accent Green/Red */}
                {formatImpact(impact.carbs)}g
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Fiber:</span>{" "}
          <span className="font-medium text-gray-800">
            {formatValue(info.fiber, "g")}
            {impact && (
              <span
                className={
                  impact.fiber > 0
                    ? "text-[#5CB85C]"
                    : impact.fiber < 0
                    ? "text-[#D9534F]"
                    : "text-gray-500"
                }
              >
                {" "}
                {/* Accent Green/Red */}
                {formatImpact(impact.fiber)}g
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

const IngredientList: React.FC<{ ingredients: Ingredient[] | undefined }> = ({
  ingredients,
}) => {
  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No ingredient details available.
      </div>
    );
  }
  return (
    <div className="p-4 border-b border-[#E0E0E0]">
      {" "}
      {/* Neutral border */}
      <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredients</h4>
      <ul className="space-y-1 text-sm list-disc list-inside pl-2 text-gray-600">
        {ingredients.map((ing, index) => (
          <li key={ing.id || `${ing.name}-${index}`}>
            {ing.name} ({ing.amount} {ing.unit})
          </li>
        ))}
      </ul>
    </div>
  );
};

const FoodList: React.FC<{ foods: Food[] | undefined }> = ({ foods }) => {
  if (!foods || foods.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No food items listed for this meal.
      </div>
    );
  }
  return (
    <div className="p-4 border-b border-[#E0E0E0]">
      {" "}
      {/* Neutral border */}
      <h4 className="text-sm font-medium text-gray-700 mb-2">Foods Included</h4>
      <div className="space-y-2">
        {foods.map((food) => (
          <div
            key={food.id}
            className="flex items-center justify-between bg-[#FEF9F0] p-2 rounded-md hover:bg-[#FADFBB]/30 cursor-pointer" // Lighter cream bg, subtle hover
            title={`View details for ${food.name} (Not Implemented)`}
          >
            <div className="flex items-center text-sm">
              <FoodTypeIcon
                type={food.type}
                className="w-4 h-4 mr-2 text-gray-500"
              />
              <span className="font-medium text-gray-800">{food.name}</span>
            </div>
            <span className="text-xs text-gray-500 capitalize">
              {food.type.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const InstructionSteps: React.FC<{ instructions: string[] | undefined }> = ({
  instructions,
}) => {
  if (!instructions || instructions.length === 0) return null;
  return (
    <div className="p-4 border-b border-[#E0E0E0]">
      {" "}
      {/* Neutral border */}
      <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
      <ol className="space-y-2 text-sm list-decimal list-inside text-gray-700">
        {instructions.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
};

const GeneralInfo: React.FC<{
  label: string;
  value: string | number | undefined | null;
  unit?: string;
}> = ({ label, value, unit }) => {
  const displayValue =
    value === undefined || value === null || value === ""
      ? "N/A"
      : `${value}${unit || ""}`;
  if (
    displayValue === "N/A" ||
    (typeof value === "number" &&
      value === 0 &&
      label.toLowerCase().includes("time"))
  )
    return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium text-gray-800">{displayValue}</span>
    </div>
  );
};

const TagsList: React.FC<{ label: string; tags: string[] | undefined }> = ({
  label,
  tags,
}) => {
  if (!tags || tags.length === 0) return null;
  return (
    <div>
      <h5 className="text-xs font-semibold text-gray-500 mb-1">{label}</h5>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-[#8FBC8F]/20 text-[#3B8E6B] rounded-full text-xs capitalize"
          >
            {" "}
            {/* Secondary color light */}
            {tag.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </div>
  );
};

const RecommendationReasons: React.FC<{
  reasons?: string[];
  benefits?: string[];
}> = ({ reasons, benefits }) => {
  const hasReasons = reasons && reasons.length > 0;
  const hasBenefits = benefits && benefits.length > 0;
  if (!hasReasons && !hasBenefits) return null;
  return (
    <div className="p-4 border-b border-[#E0E0E0] space-y-3">
      {" "}
      {/* Neutral border */}
      {hasReasons && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Why Recommended?
          </h4>
          <ul className="space-y-1 text-sm list-disc list-inside pl-2 text-[#8B4513]">
            {" "}
            {/* Primary color */}
            {reasons.map((reason, index) => (
              <li key={`reason-${index}`}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
      {hasBenefits && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Health Benefits
          </h4>
          <ul className="space-y-1 text-sm list-disc list-inside pl-2 text-[#5CB85C]">
            {" "}
            {/* Accent Green */}
            {benefits.map((benefit, index) => (
              <li key={`benefit-${index}`}>{benefit}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ScoreDisplay: React.FC<{
  varietyScore?: number | null;
  coverageScore?: number | null;
  constraintScore?: number | null;
  title?: string;
}> = ({
  varietyScore,
  coverageScore,
  constraintScore,
  title = "Recommendation Scores",
}) => {
  if (
    varietyScore === undefined &&
    coverageScore === undefined &&
    constraintScore === undefined
  ) {
    return null;
  }
  return (
    <div className="p-4 border-b border-[#E0E0E0]">
      {" "}
      {/* Neutral border */}
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="flex justify-around text-center text-xs">
        <div>
          <div className="font-semibold text-[#20B2AA]">
            {formatScore(varietyScore)}
          </div>{" "}
          {/* Nutrient Teal */}
          <div className="text-gray-500">Variety</div>
        </div>
        <div>
          <div className="font-semibold text-[#8B4513]">
            {formatScore(coverageScore)}
          </div>{" "}
          {/* Nutrient Maroon */}
          <div className="text-gray-500">Coverage</div>
        </div>
        <div>
          <div className="font-semibold text-[#DAA520]">
            {formatScore(constraintScore)}
          </div>{" "}
          {/* Nutrient Gold */}
          <div className="text-gray-500">Nutrition</div>
        </div>
      </div>
    </div>
  );
};

// Context for Trace items
const ContextInfo: React.FC<{ text: string }> = ({ text }) => (
  <div className="p-4 border-b border-[#FFC107]/30 bg-[#FFC107]/15 text-[#8A6D3B] text-sm">
    {" "}
    {/* Accent Yellow light */}
    {text}
    {/* Add clickable elements here if needed */}
  </div>
);

// Context for Recommended items
const RecommendationContext: React.FC<{
  parentMealName?: string;
  parentRecScores?: { v?: number | null; c?: number | null; n?: number | null };
}> = ({ parentMealName, parentRecScores }) => {
  if (!parentMealName) return null;
  return (
    <div className="p-4 border-b border-[#5CB85C]/30 bg-[#5CB85C]/15">
      {" "}
      {/* Accent Green light */}
      <h4 className="text-sm font-medium text-[#3C763D] mb-2">
        Part of Recommendation
      </h4>
      <p className="text-xs text-[#3C763D] mb-1">
        This item is part of the '
        <span className="font-semibold">{parentMealName}</span>' recommendation.
      </p>
      {parentRecScores && (
        <p className="text-xs text-[#3C763D]/80">
          (Parent Scores - V: {formatScore(parentRecScores.v)}, C:{" "}
          {formatScore(parentRecScores.c)}, N: {formatScore(parentRecScores.n)})
        </p>
      )}
      <p className="text-xs text-[#3C763D] mt-2">
        Use the buttons on the main recommendation card in the calendar to
        accept or reject.
      </p>
    </div>
  );
};

// Main Panel Component
export const MealDetailsPanel: React.FC<MealDetailsPanelProps> = ({
  meal,
  food,
  ingredient,
  recommendation,
  onClose,
  nutritionalGoals, // Can be null
  currentNutritionalValues, // Current day's totals (including simulated recommendation if selected)
  selectedDate,
  currentLevel,
}) => {
  // Determine what to display based on selection priority:
  // If a specific food/ingredient is selected, prioritize it.
  // If only a recommendation is selected, show the recommendation summary.
  // If only a meal is selected, show the meal.
  const displayItem = ingredient || food || recommendation || meal;
  const displayType = ingredient
    ? "ingredient"
    : food
    ? "food"
    : recommendation
    ? "recommendation"
    : meal
    ? "meal"
    : "none";

  // Determine if the primary selected item is a recommendation or part of one
  // This is true if the top-level selection is a recommendation OR
  // if a food/ingredient is selected AND it's part of the selected recommendation.
  const isShowingRecommendationContext = recommendation !== null;

  const renderContent = () => {
    if (!displayItem) {
      return (
        <div className="p-6 text-center text-gray-500">
          <p>Select an item from the calendar to see details.</p>
          <p className="mt-2 text-sm">
            Currently viewing:{" "}
            <span className="font-medium capitalize">{currentLevel}</span> level
            for{" "}
            {isValid(selectedDate)
              ? format(selectedDate, "MMM d, yyyy")
              : "selected date"}
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Recommended meals are suggestions based on your goals and
            preferences. Use the{" "}
            <span className="font-semibold text-green-600">✓</span> and{" "}
            <span className="font-semibold text-red-500">✕</span> buttons on the
            cards to accept or reject them.
          </p>
        </div>
      );
    }

    switch (displayType) {
      // Level: Meal | Type: Recommended Meal
      case "recommendation": {
        const rec = displayItem as MealRecommendation;
        const recDate = rec.meal?.date || selectedDate;
        return (
          <>
            <DetailHeader
              title={rec.meal?.name || "Recommended Meal"}
              subtitle={`Recommended ${rec.meal?.type || "meal"} for ${
                isValid(recDate) ? format(recDate, "MMM d, yyyy") : ""
              }`}
              isRecommendation // Badge
              onClose={onClose}
            />
            <RecommendationReasons
              reasons={rec.reasons}
              benefits={rec.healthBenefits}
            />
            <ScoreDisplay
              varietyScore={rec.varietyScore}
              coverageScore={rec.coverageScore}
              constraintScore={rec.constraintScore}
              title="Recommendation Scores"
            />
            <NutritionalBreakdown
              info={rec.meal?.nutritionalInfo}
              impact={rec.nutritionalImpact} // Show impact
            />
            <FoodList foods={rec.meal?.foods} />
            {/* TODO: Add other relevant sections if needed */}
          </>
        );
      }
      // Level: Meal | Type: Trace (Logged/Historical Meal)
      case "meal": {
        const m = displayItem as Meal;
        const mealDate = m.date || selectedDate;
        return (
          <>
            {/* Pass isFavorited status to DetailHeader */}
            <DetailHeader
              title={m.name}
              subtitle={`${
                m.type.charAt(0).toUpperCase() + m.type.slice(1)
              } on ${
                isValid(mealDate) ? format(mealDate, "MMM d, yyyy") : ""
              } (Saved)`}
              isTraceMeal // For favorite button
              onClose={onClose}
            />
            <ScoreDisplay
              varietyScore={m.varietyScore}
              coverageScore={m.coverageScore}
              constraintScore={m.constraintScore}
              title="Meal Scores"
            />
            <NutritionalBreakdown info={m.nutritionalInfo} />
            <FoodList foods={m?.foods} />
            <div className="p-4 border-b space-y-2">
              <TagsList label="Cultural Tips" tags={m.culturalTips} />
            </div>
          </>
        );
      }
      // Level: Food | Type: Recommended Food OR Trace Food
      case "food": {
        const f = displayItem as Food;
        // Check if this food is part of the currently selected recommendation
        const isRecommendedFood =
          isShowingRecommendationContext && // A recommendation must be selected
          recommendation && // Ensure recommendation is not null (redundant but safe)
          recommendation.meal.foods.some((recFood) => recFood.id === f.id);

        // Get parent recommendation meal if applicable
        const parentRecMeal = isRecommendedFood ? recommendation?.meal : null;
        // Get parent trace meal if applicable (only if food is trace AND meal is selected)
        const parentTraceMeal = !isRecommendedFood ? meal : null;

        return (
          <>
            <DetailHeader
              title={f.name}
              subtitle={`${f.type.replace("_", " ")} ${
                isRecommendedFood ? "(Recommended)" : "(Saved)"
              }`}
              isRecommendation={isRecommendedFood}
              onClose={onClose}
            />
            {/* Recommendation Context */}
            {isRecommendedFood &&
              recommendation && ( // Ensure recommendation exists
                <RecommendationContext
                  parentMealName={parentRecMeal?.name}
                  parentRecScores={{
                    // Use scores from the top-level recommendation object
                    v: recommendation.varietyScore,
                    c: recommendation.coverageScore,
                    n: recommendation.constraintScore,
                  }}
                />
              )}
            {!isRecommendedFood && parentTraceMeal && (
              <ContextInfo
                text={`Part of '${parentTraceMeal.name}' on ${
                  isValid(parentTraceMeal.date || selectedDate)
                    ? format(parentTraceMeal.date || selectedDate, "MMM d")
                    : ""
                }`}
              />
            )}
            <NutritionalBreakdown info={f.nutritionalInfo} />
            <IngredientList ingredients={f.ingredients} />
            <InstructionSteps instructions={f.instructions} />
            <div className="p-4 border-b space-y-2">
              <GeneralInfo
                label="Prep Time"
                value={f.preparationTime}
                unit=" min"
              />
              <GeneralInfo
                label="Cook Time"
                value={f.cookingTime}
                unit=" min"
              />
              <TagsList label="Cultural Origin" tags={f.culturalOrigin} />
              <TagsList label="Allergens" tags={f.allergens} />
              <TagsList label="Tips" tags={f.tips} />
            </div>
          </>
        );
      }
      // Level: Ingredient | Type: Recommended Ingredient OR Trace Ingredient
      case "ingredient": {
        const i = displayItem as Ingredient;
        // Check if this ingredient is part of the currently selected recommendation
        const isRecommendedIngredient =
          isShowingRecommendationContext &&
          recommendation && // Ensure recommendation is not null
          recommendation.meal.foods.some((recFood) =>
            recFood.ingredients.some(
              (ing) =>
                (ing.id && ing.id === i.id) || // Match by ID first
                (!ing.id && !i.id && ing.name === i.name) // Fallback to name if IDs missing
            )
          );

        // Find the parent food and meal for context
        let parentFoodName: string | undefined;
        let parentMealName: string | undefined;
        let parentMealDate: Date | undefined;
        let parentRecScores:
          | { v?: number | null; c?: number | null; n?: number | null }
          | undefined;

        if (isRecommendedIngredient && recommendation) {
          parentMealName = recommendation.meal.name;
          parentRecScores = {
            v: recommendation.varietyScore,
            c: recommendation.coverageScore,
            n: recommendation.constraintScore,
          };
          const parentFood = recommendation.meal.foods.find((recFood) =>
            recFood.ingredients.some(
              (ing) =>
                (ing.id && ing.id === i.id) ||
                (!ing.id && !i.id && ing.name === i.name)
            )
          );
          parentFoodName = parentFood?.name;
        } else if (food) {
          // If a trace ingredient is selected, the parent 'food' should be selected too
          parentFoodName = food.name;
          if (meal) {
            // If the parent 'meal' is also selected
            parentMealName = meal.name;
            parentMealDate = meal.date;
          }
        }

        const categoryColor =
          COLOR_SCHEMES.ingredient[
            i.category as keyof typeof COLOR_SCHEMES.ingredient
          ] || "#cccccc";

        return (
          <>
            <DetailHeader
              title={i.name}
              // Display amount/unit if available
              subtitle={`Ingredient ${
                i.amount != null && i.unit
                  ? `(${i.amount} ${i.unit})`
                  : i.amount != null
                  ? `(${i.amount})`
                  : i.unit
                  ? `(${i.unit})`
                  : ""
              } ${isRecommendedIngredient ? "(Recommended)" : "(Saved)"}`}
              isRecommendation={isRecommendedIngredient}
              onClose={onClose}
            />
            {/* Recommendation Context */}
            {isRecommendedIngredient && (
              <RecommendationContext
                parentMealName={parentMealName}
                parentRecScores={parentRecScores}
              />
            )}
            {/* Trace Context */}
            {!isRecommendedIngredient && parentFoodName && (
              <ContextInfo
                text={`Used in '${parentFoodName}'${
                  parentMealName
                    ? ` (Part of '${parentMealName}' on ${
                        isValid(parentMealDate || selectedDate)
                          ? format(parentMealDate || selectedDate, "MMM d")
                          : ""
                      })`
                    : ""
                }`}
              />
            )}

            {/* Standard Ingredient Details - SIMPLIFIED */}
            {/* Show Category if available */}
            {i.category && (
              <div className="p-4 border-b flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoryColor }}
                ></div>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  Category: {i.category}
                </span>
              </div>
            )}

            {/* Add a placeholder if category is also missing */}
            {!i.category && (
              <div className="p-4 text-sm text-gray-500">
                Basic ingredient details. More information may be available at
                the Food or Meal level.
              </div>
            )}
          </>
        );
      }
      default:
        return null;
    }
  };

  // Nutritional Goals Progress Section
  const renderGoalsProgress = () => {
    if (!nutritionalGoals) {
      return (
        <div className="flex-shrink-0 border-t bg-gradient-to-br from-white to-gray-50 p-6 text-center text-gray-500">
          Loading nutritional goals...
        </div>
      );
    }

    const displayValues = currentNutritionalValues;
    const { dailyCalories, carbohydrates, protein, fiber } = nutritionalGoals;
    const calcProgress = (current: number, target: number) => {
      if (target <= 0) return 0;
      return Math.min(Math.max((current / target) * 100, 0), 100);
    };

    // Define goal colors
    const goalColors = {
      calories: {
        text: "text-green-600",
        bgGradient: "from-green-400 to-green-500",
      },
      carbs: { text: "text-blue-600", bgGradient: "from-blue-400 to-blue-500" },
      protein: {
        text: "text-purple-600",
        bgGradient: "from-purple-400 to-purple-500",
      },
      fiber: {
        text: "text-orange-600",
        bgGradient: "from-orange-400 to-orange-500",
      },
    };

    return (
      <div className="flex-shrink-0 border-t bg-gradient-to-br from-white to-gray-50 p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Daily Nutrition Goals Progress
            </h3>
            <span className="text-xs text-gray-500">
              {isValid(selectedDate) ? format(selectedDate, "MMM d, yyyy") : ""}
            </span>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            {/* Calories */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">Calories</span>
                <span className="text-gray-500">
                  {displayValues.calories.toFixed(0)} /{" "}
                  {dailyCalories.toFixed(0)} kcal
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${calcProgress(
                      displayValues.calories,
                      dailyCalories
                    )}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Carbohydrates */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">Carbohydrates</span>
                <span className="text-gray-500">
                  {displayValues.carbs.toFixed(0)} /{" "}
                  {carbohydrates.daily.toFixed(0)}
                  {carbohydrates.unit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${calcProgress(
                      displayValues.carbs,
                      carbohydrates.daily
                    )}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Protein */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">Protein</span>
                <span className="text-gray-500">
                  {displayValues.protein.toFixed(0)} /{" "}
                  {protein.daily.toFixed(0)}
                  {protein.unit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${calcProgress(
                      displayValues.protein,
                      protein.daily
                    )}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Fiber */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">Fiber</span>
                <span className="text-gray-500">
                  {displayValues.fiber.toFixed(0)} / {fiber.daily.toFixed(0)}
                  {fiber.unit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${calcProgress(displayValues.fiber, fiber.daily)}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[
              {
                label: "Calories",
                value: `${Math.round(
                  calcProgress(displayValues.calories, dailyCalories)
                )}%`,
                color: "text-green-500",
              },
              {
                label: "Carbs",
                value: `${Math.round(
                  calcProgress(displayValues.carbs, carbohydrates.daily)
                )}%`,
                color: "text-blue-500",
              },
              {
                label: "Protein",
                value: `${Math.round(
                  calcProgress(displayValues.protein, protein.daily)
                )}%`,
                color: "text-purple-500",
              },
              {
                label: "Fiber",
                value: `${Math.round(
                  calcProgress(displayValues.fiber, fiber.daily)
                )}%`,
                color: "text-orange-500",
              },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-sm font-semibold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Final Render
  return (
    <div className="h-full flex flex-col bg-white border-l border-[#E0E0E0]">
      {" "}
      {/* Neutral border */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={
              displayType +
              (displayItem as any)?.id +
              (isShowingRecommendationContext
                ? recommendation?.meal.id
                : "trace") +
              currentLevel
            }
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Nutritional Goals Progress */}
      {renderGoalsProgress()}
    </div>
  );
};
