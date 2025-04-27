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
import {
  StarIcon as StarIconOutline,
  InformationCircleIcon,
  XMarkIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
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
  onShowRecipe: (food: Food) => void;
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
}) => {
  const favoriteTooltip = isFavorited
    ? "Favorited (Click to Unfavorite - Not Implemented)"
    : "Favorite (Not Implemented)";

  return (
    <div className="p-5 border-b border-[#E0E0E0] bg-[#FEF9F0] relative">
      {/* Recommendation Badge */}
      {isRecommendation && (
        <span className="absolute top-3 left-3 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold z-10 shadow-sm">
          Recommended
        </span>
      )}
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-pink-900 hover:bg-pink-100 rounded-full transition-colors duration-150 z-10"
        aria-label="Close details"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
      {/* Favorite Button for Trace Meals */}
      {isTraceMeal && (
        <button
          // onClick={onFavoriteClick} // Not implemented
          onClick={() =>
            console.warn("Favorite click not implemented in panel")
          }
          className="absolute top-3 right-12 p-1.5 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors duration-150 z-10"
          aria-label={isFavorited ? "Unfavorite meal" : "Favorite meal"}
          data-tooltip-id="global-tooltip"
          data-tooltip-content={favoriteTooltip}
        >
          {/* Use isFavorited prop to show solid or outline star */}
          {isFavorited ? (
            <StarIconSolid className="w-5 h-5" />
          ) : (
            <StarIconOutline className="w-5 h-5" />
          )}
        </button>
      )}
      {/* Title and Subtitle */}
      <h3 className="text-xl font-bold text-pink-900 mt-6 pr-16">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
};

const NutritionalBreakdown: React.FC<{
  info: NutritionalInfo | undefined;
  impact?: MealRecommendation["nutritionalImpact"];
}> = ({ info, impact }) => {
  if (!info) {
    return (
      <div className="py-4 px-5 text-sm text-gray-500 border-t border-gray-100">
        Nutritional information not available.
      </div>
    );
  }

  const formatImpact = (value: number | undefined): string => {
    if (value === undefined || value === 0) return "";
    const prefix = value > 0 ? "+" : "";
    return ` (${prefix}${value.toFixed(0)})`;
  };

  const formatValue = (
    value: number | null | undefined,
    unit: string = "",
    precision: number = 0
  ): string => {
    if (value === null || value === undefined) return "N/A";
    return `${value.toFixed(precision)}${unit}`;
  };

  const getImpactColor = (value: number | undefined): string => {
    if (value === undefined || value === 0) return "text-gray-500";
    return value > 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="py-4 px-5 border-t border-gray-100">
      <h4 className="text-base font-semibold text-gray-800 mb-3">
        Nutritional Information
      </h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {[
          {
            label: "Calories",
            value: info.calories,
            unit: "",
            impactVal: impact?.calories,
          },
          {
            label: "Protein",
            value: info.protein,
            unit: "g",
            impactVal: impact?.protein,
          },
          {
            label: "Carbs",
            value: info.carbs,
            unit: "g",
            impactVal: impact?.carbs,
          },
          {
            label: "Fiber",
            value: info.fiber,
            unit: "g",
            impactVal: impact?.fiber,
          },
        ].map((item) => (
          <div key={item.label} className="flex justify-between items-baseline">
            <span className="text-gray-600">{item.label}:</span>
            <span className="font-medium text-gray-900">
              {formatValue(item.value, item.unit)}
              {impact && (
                <span className={`${getImpactColor(item.impactVal)} ml-1`}>
                  {formatImpact(item.impactVal)}
                  {item.unit}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const IngredientList: React.FC<{ ingredients: Ingredient[] | undefined }> = ({
  ingredients,
}) => {
  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="py-4 px-5 text-sm text-gray-500 border-t border-gray-100">
        No ingredient details available.
      </div>
    );
  }
  return (
    <div className="py-4 px-5 border-t border-gray-100">
      <h4 className="text-base font-semibold text-gray-800 mb-3">
        Ingredients
      </h4>
      <ul className="space-y-1.5 text-sm list-disc list-inside pl-2 text-gray-700">
        {ingredients.map((ing, index) => (
          <li key={ing.id || `${ing.name}-${index}`}>
            <span className="font-medium text-gray-800">{ing.name}</span>
            <span className="text-gray-600">
              {" "}
              ({ing.amount} {ing.unit})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FoodList: React.FC<{ foods: Food[] | undefined }> = ({ foods }) => {
  if (!foods || foods.length === 0) {
    return (
      <div className="py-4 px-5 text-sm text-gray-500 border-t border-gray-100">
        No food items listed for this meal.
      </div>
    );
  }
  return (
    <div className="py-4 px-5 border-t border-gray-100">
      <h4 className="text-base font-semibold text-gray-800 mb-3">
        Foods Included
      </h4>
      <div className="space-y-2">
        {foods.map((food) => (
          <div
            key={food.id}
            className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg hover:bg-gray-100 transition-colors duration-150"
            title={`View details for ${food.name} in the Food View`}
          >
            <div className="flex items-center text-sm space-x-2">
              <FoodTypeIcon
                type={food.type}
                className="w-5 h-5 text-pink-800 flex-shrink-0"
              />
              <span className="font-medium text-gray-800">{food.name}</span>
            </div>
            <span className="text-xs text-gray-500 capitalize bg-white px-2 py-0.5 rounded-full border border-gray-200">
              {food.type.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
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
    <div className="flex justify-between text-sm items-baseline">
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
    <div className="mt-3">
      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </h5>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium capitalize" // Using teal for tags
          >
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
    <div className="py-4 px-5 border-t border-gray-100 space-y-4">
      {hasReasons && (
        <div>
          <h4 className="text-base font-semibold text-gray-800 mb-2">
            Why Recommended?
          </h4>
          <ul className="space-y-1.5 text-sm pl-2 text-pink-900">
            {reasons.map((reason, index) => (
              <li key={`reason-${index}`} className="text-gray-700">
                <span className="font-medium text-pink-900 mr-1">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasBenefits && (
        <div>
          <h4 className="text-base font-semibold text-gray-800 mb-2">
            Health Benefits
          </h4>
          <ul className="space-y-1.5 text-sm pl-2 text-green-700">
            {benefits.map((benefit, index) => (
              <li key={`benefit-${index}`} className="text-gray-700">
                <span className="font-medium text-green-700 mr-1">•</span>
                {benefit}
              </li>
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

  // Define the descriptions for the tooltips
  const scoreDescriptions = {
    variety: "Measures the variation present in the recommended items",
    coverage:
      "Measures how well the recommended items fit the requested roles (Main Course, Side, etc.)",
    nutrition:
      "Measures how well the recommended items fit the requested user preferences (dairy, meat, and nuts)",
  };

  const scores = [
    {
      label: "Variety",
      value: varietyScore,
      color: "text-teal-600",
      desc: scoreDescriptions.variety,
    },
    {
      label: "Coverage",
      value: coverageScore,
      color: "text-pink-900",
      desc: scoreDescriptions.coverage,
    },
    {
      label: "Nutrition",
      value: constraintScore,
      color: "text-amber-600",
      desc: scoreDescriptions.nutrition,
    },
  ];

  return (
    <div className="py-4 px-5 border-t border-gray-100">
      <h4 className="text-base font-semibold text-gray-800 mb-3">{title}</h4>
      <div className="flex justify-around text-center">
        {scores.map((score) => (
          <div key={score.label}>
            <div className={`text-xl font-bold ${score.color}`}>
              {formatScore(score.value)}
            </div>
            <div className="text-xs text-gray-500 flex items-center justify-center space-x-1 mt-0.5">
              <span>{score.label}</span>
              <InformationCircleIcon
                className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help"
                data-tooltip-id="global-tooltip"
                data-tooltip-content={score.desc}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ContextInfo: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-3 px-5 border-t border-yellow-200 bg-yellow-50 text-yellow-800 text-sm">
    <InformationCircleIcon className="w-4 h-4 inline mr-1.5 relative -top-px" />
    {text}
  </div>
);

const RecommendationContext: React.FC<{
  parentMealName?: string;
  parentRecScores?: { v?: number | null; c?: number | null; n?: number | null };
}> = ({ parentMealName, parentRecScores }) => {
  if (!parentMealName) return null;
  return (
    <div className="py-3 px-5 border-t border-green-200 bg-green-50">
      <h4 className="text-sm font-semibold text-green-800 mb-1.5 flex items-center">
        <InformationCircleIcon className="w-4 h-4 inline mr-1.5" />
        Part of Recommendation
      </h4>
      <p className="text-xs text-green-700 mb-1 pl-5">
        This item is part of the '
        <span className="font-semibold">{parentMealName}</span>' recommendation.
      </p>
      {parentRecScores && (
        <p className="text-xs text-green-700/80 pl-5">
          (Parent Scores - V: {formatScore(parentRecScores.v)}, C:{" "}
          {formatScore(parentRecScores.c)}, N: {formatScore(parentRecScores.n)})
        </p>
      )}
      <p className="text-xs text-green-700 mt-1.5 pl-5">
        Use the buttons on the main recommendation card to accept or reject.
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
  onShowRecipe,
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
        <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
          <InformationCircleIcon className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-700">Select an Item</p>
          <p className="mt-2 text-sm">
            Click on a meal, food, or ingredient in the calendar to view its
            details here.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Currently viewing:{" "}
            <span className="font-medium capitalize">{currentLevel}</span> level
            for{" "}
            {isValid(selectedDate)
              ? format(selectedDate, "MMM d, yyyy")
              : "selected date"}
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
              isRecommendation
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
              impact={rec.nutritionalImpact}
            />
            <FoodList foods={rec.meal?.foods} />
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
              isTraceMeal
              isFavorited={m.isFavorited}
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
            <div className="py-4 px-5 border-t border-gray-100">
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
          isShowingRecommendationContext &&
          recommendation &&
          recommendation.meal.foods.some((recFood) => recFood.id === f.id);

        const parentRecMeal = isRecommendedFood ? recommendation?.meal : null;
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
            {isRecommendedFood && recommendation && (
              <RecommendationContext
                parentMealName={parentRecMeal?.name}
                parentRecScores={{
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
            <div className="py-4 px-5 border-t border-gray-100 space-y-3">
              <h4 className="text-base font-semibold text-gray-800 mb-1">
                Details
              </h4>
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

            {f.instructions && f.instructions.length > 0 && (
              <div className="py-4 px-5 border-t border-gray-100">
                <button
                  onClick={() => onShowRecipe(f)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-pink-900 text-white rounded-md hover:bg-[#A0522D] transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-700"
                >
                  <BookOpenIcon className="w-4 h-4 mr-2" />
                  View Full Recipe
                </button>
              </div>
            )}
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
          ] || "#A0AEC0"; // Default gray

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
            {isRecommendedIngredient && (
              <RecommendationContext
                parentMealName={parentMealName}
                parentRecScores={parentRecScores}
              />
            )}
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

            <div className="py-4 px-5 border-t border-gray-100 space-y-3">
              <h4 className="text-base font-semibold text-gray-800 mb-1">
                Details
              </h4>
              {i.category && (
                <div className="flex items-center space-x-2.5 text-sm">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-300"
                    style={{ backgroundColor: categoryColor }}
                  ></span>
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-800 capitalize">
                    {i.category}
                  </span>
                </div>
              )}
              {/* Basic Nutritional Info for Ingredient (if available) */}
              {i.nutritionalInfo && (
                <div className="pt-3 border-t border-gray-100 mt-3">
                  <NutritionalBreakdown info={i.nutritionalInfo} />
                </div>
              )}
              {!i.category && !i.nutritionalInfo && (
                <div className="text-sm text-gray-500">
                  Basic ingredient details. More information may be available at
                  the Food or Meal level.
                </div>
              )}
            </div>
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
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
          Loading nutritional goals...
        </div>
      );
    }

    const displayValues = currentNutritionalValues;
    const { dailyCalories, carbohydrates, protein, fiber } = nutritionalGoals;
    const calcProgress = (current: number, target: number) => {
      if (target <= 0) return 0;
      return Math.min(Math.max((current / target) * 100, 0), 100); // Cap at 100%
    };

    const goals = [
      {
        label: "Calories",
        current: displayValues.calories,
        target: dailyCalories,
        unit: "kcal",
        color: "bg-gradient-to-r from-gray-400 to-gray-600", // Existing gradient
        textColor: "text-gray-800",
      },
      {
        label: "Carbs",
        current: displayValues.carbs,
        target: carbohydrates.daily,
        unit: carbohydrates.unit,
        // Gradient from 50% opacity to full color
        color: "bg-gradient-to-r from-[#20B2AA]/50 to-[#20B2AA]",
        textColor: "text-[#20B2AA]",
      },
      {
        label: "Protein",
        current: displayValues.protein,
        target: protein.daily,
        unit: protein.unit,
        // Gradient from 50% opacity to full color
        color: "bg-gradient-to-r from-[#8B4513]/50 to-[#8B4513]",
        textColor: "text-[#8B4513]",
      },
      {
        label: "Fiber",
        current: displayValues.fiber,
        target: fiber.daily,
        unit: fiber.unit,
        // Gradient from 50% opacity to full color
        color: "bg-gradient-to-r from-[#DAA520]/50 to-[#DAA520]",
        textColor: "text-[#DAA520]",
      },
    ];

    return (
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">
              Daily Nutrition Progress
            </h3>
            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
              {isValid(selectedDate) ? format(selectedDate, "MMM d, yyyy") : ""}
            </span>
          </div>

          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-medium ${goal.textColor}`}>
                    {goal.label}
                  </span>
                  <span className="text-gray-500">
                    {goal.current.toFixed(0)} / {goal.target.toFixed(0)}{" "}
                    {goal.unit}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${goal.color}`}
                    initial={{ width: "0%" }}
                    animate={{
                      width: `${calcProgress(goal.current, goal.target)}%`,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {goals.map((goal) => (
              <div key={goal.label + "-stat"} className="text-center">
                <div className={`text-lg font-bold ${goal.textColor}`}>
                  {Math.round(calcProgress(goal.current, goal.target))}%
                </div>
                <div className="text-xs text-gray-500">{goal.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Final Render
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 shadow-lg">
      {/* Scrollable Content Area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarGutter: "stable" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            // More specific key to handle transitions between different items of the same type
            key={
              displayType +
              (displayItem as any)?.id +
              (isShowingRecommendationContext
                ? recommendation?.meal.id
                : "trace") +
              currentLevel +
              selectedDate.toISOString() // Add date to key if selection might persist across dates
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="divide-y divide-gray-100" // Use divider within the motion div if needed, or manage borders within sections
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Nutritional Goals Progress Footer */}
      {renderGoalsProgress()}
    </div>
  );
};
