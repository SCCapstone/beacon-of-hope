import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Meal,
  Food,
  Ingredient,
  MealRecommendation,
  NutritionalInfo,
  VisualizationLevel,
} from "../types";
import { format } from "date-fns";
import { FoodTypeIcon } from "./FoodTypeIcon";
import { COLOR_SCHEMES } from "../constants";

interface MealDetailsPanelProps {
  meal: Meal | null;
  food: Food | null;
  ingredient: Ingredient | null;
  recommendation: MealRecommendation | null;
  onClose: () => void;
  nutritionalGoals: {
    dailyCalories: number;
    carbohydrates: { min: number; max: number; unit: string };
    protein: { min: number; max: number; unit: string };
    fiber: { daily: number; unit: string };
  };
  currentNutritionalValues: {
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
  };
  baseNutritionalValues: {
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
  };
  selectedDate: Date;
  currentLevel: VisualizationLevel["type"];
}

const DetailHeader: React.FC<{
  title: string;
  subtitle?: string;
  isRecommendation?: boolean;
  score?: number;
  onClose: () => void;
}> = ({ title, subtitle, isRecommendation, score, onClose }) => (
  <div className="p-4 border-b bg-gray-50 relative">
    {isRecommendation && (
      <span className="absolute top-2 left-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
        Recommended {score && `(${score})`}
      </span>
    )}
    <button
      onClick={onClose}
      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
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
    <h3 className="text-lg font-semibold text-gray-800 mt-4">{title}</h3>
    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
  </div>
);

const NutritionalBreakdown: React.FC<{
  info: NutritionalInfo;
  impact?: MealRecommendation["nutritionalImpact"];
}> = ({ info, impact }) => {
  const formatImpact = (value: number | undefined): string => {
    if (value === undefined) return "";
    const prefix = value > 0 ? "+" : "";
    return ` (${prefix}${value})`;
  };

  return (
    <div className="p-4 border-b">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Nutritional Information
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex justify-between">
          <span>Calories:</span>{" "}
          <span className="font-medium">
            {info.calories}
            {impact && (
              <span
                className={
                  impact.calories > 0 ? "text-green-600" : "text-red-600"
                }
              >
                {formatImpact(impact.calories)}
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Protein:</span>{" "}
          <span className="font-medium">
            {info.protein}g
            {impact && (
              <span
                className={
                  impact.protein > 0 ? "text-green-600" : "text-red-600"
                }
              >
                {formatImpact(impact.protein)}g
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Carbs:</span>{" "}
          <span className="font-medium">
            {info.carbs}g
            {impact && (
              <span
                className={impact.carbs > 0 ? "text-green-600" : "text-red-600"}
              >
                {formatImpact(impact.carbs)}g
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Fat:</span> <span className="font-medium">{info.fat}g</span>
        </div>
        <div className="flex justify-between">
          <span>Fiber:</span>{" "}
          <span className="font-medium">
            {info.fiber}g
            {impact && (
              <span
                className={impact.fiber > 0 ? "text-green-600" : "text-red-600"}
              >
                {formatImpact(impact.fiber)}g
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Sugar:</span>{" "}
          <span className="font-medium">
            {info.sugarContent?.toFixed(1) ?? "N/A"}g
          </span>
        </div>
        <div className="flex justify-between">
          <span>Glycemic Index:</span>{" "}
          <span className="font-medium">
            {info.glycemicIndex?.toFixed(1) ?? "N/A"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Glycemic Load:</span>{" "}
          <span className="font-medium">{info.glycemicLoad ?? "N/A"}</span>
        </div>
      </div>
    </div>
  );
};

const IngredientList: React.FC<{ ingredients: Ingredient[] }> = ({
  ingredients,
}) => (
  <div className="p-4 border-b">
    <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredients</h4>
    <ul className="space-y-1 text-sm list-disc list-inside pl-2 text-gray-600">
      {ingredients.map((ing) => (
        <li key={ing.id || ing.name}>
          {ing.name} ({ing.amount} {ing.unit})
        </li>
      ))}
    </ul>
  </div>
);

const FoodList: React.FC<{ foods: Food[] }> = ({ foods }) => (
  <div className="p-4 border-b">
    <h4 className="text-sm font-medium text-gray-700 mb-2">Foods Included</h4>
    <div className="space-y-2">
      {foods.map((food) => (
        <div
          key={food.id}
          className="flex items-center justify-between bg-gray-50 p-2 rounded"
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

const InstructionSteps: React.FC<{ instructions: string[] }> = ({
  instructions,
}) => (
  <div className="p-4 border-b">
    <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
    <ol className="space-y-2 text-sm list-decimal list-inside text-gray-700">
      {instructions.map((step, index) => (
        <li key={index}>{step}</li>
      ))}
    </ol>
  </div>
);

const GeneralInfo: React.FC<{
  label: string;
  value: string | number | undefined;
  unit?: string;
}> = ({ label, value, unit }) => {
  if (value === undefined || value === null || value === 0 || value === "")
    return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium text-gray-800">
        {value}
        {unit}
      </span>
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
            className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs"
          >
            {tag.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
};

const RecommendationReasons: React.FC<{
  reasons?: string[];
  benefits?: string[];
}> = ({ reasons, benefits }) => (
  <div className="p-4 border-b space-y-3">
    {reasons && reasons.length > 0 && (
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Why Recommended?
        </h4>
        <ul className="space-y-1 text-sm list-disc list-inside pl-2 text-blue-700">
          {reasons.map((reason, index) => (
            <li key={`reason-${index}`}>{reason}</li>
          ))}
        </ul>
      </div>
    )}
    {benefits && benefits.length > 0 && (
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Health Benefits
        </h4>
        <ul className="space-y-1 text-sm list-disc list-inside pl-2 text-green-700">
          {benefits.map((benefit, index) => (
            <li key={`benefit-${index}`}>{benefit}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

// --- Main Panel Component ---
export const MealDetailsPanel: React.FC<MealDetailsPanelProps> = ({
  meal,
  food,
  ingredient,
  recommendation,
  onClose,
  nutritionalGoals,
  currentNutritionalValues,
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
    ? "recommendation" // Full recommendation view
    : meal
    ? "meal"
    : "none";

  // Determine if the primary selected item is a recommendation (or part of one)
  const isShowingRecommendation = recommendation !== null;

  const renderContent = () => {
    if (!displayItem) {
      return (
        <div className="p-6 text-center text-gray-500">
          <p>Select an item from the calendar to see details.</p>
          <p className="mt-2 text-sm">
            Currently viewing:{" "}
            <span className="font-medium capitalize">{currentLevel}</span> level
            for {format(selectedDate, "MMM d, yyyy")}
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Recommended meals are suggestions. Use the buttons on the
            recommendation cards to accept or reject them.
          </p>
        </div>
      );
    }

    switch (displayType) {
      case "recommendation": {
        const rec = displayItem as MealRecommendation;
        const recDate = rec.meal.date || selectedDate;
        return (
          <>
            <DetailHeader
              title={rec.meal.name}
              subtitle={`Recommended ${rec.meal.type} for ${format(
                recDate,
                "MMM d"
              )}`}
              isRecommendation // Always true here
              score={rec.score}
              onClose={onClose}
            />
            <RecommendationReasons
              reasons={rec.reasons}
              benefits={rec.healthBenefits}
            />
            <NutritionalBreakdown
              info={rec.meal.nutritionalInfo}
              impact={rec.nutritionalImpact}
            />
            <FoodList foods={rec.meal.foods} />
          </>
        );
      }
      case "meal": {
        const m = displayItem as Meal;
        const mealDate = m.date || selectedDate;
        return (
          <>
            <DetailHeader
              title={m.name}
              subtitle={`${
                m.type.charAt(0).toUpperCase() + m.type.slice(1)
              } on ${format(mealDate, "MMM d")} (Saved)`} // Indicate it's saved
              isRecommendation={false}
              onClose={onClose}
            />
            <NutritionalBreakdown info={m.nutritionalInfo} />
            <FoodList foods={m.foods} />
            <div className="p-4 border-b space-y-2">
              <TagsList label="Cultural Tips" tags={m.culturalTips} />
              <TagsList label="Health Benefits" tags={m.healthBenefits} />
            </div>
          </>
        );
      }
      case "food": {
        const f = displayItem as Food;
        const isRecommendedFood =
          recommendation !== null &&
          recommendation.meal.foods.some((recFood) => recFood.id === f.id);

        return (
          <>
            <DetailHeader
              title={f.name}
              subtitle={`${f.type.replace("_", " ")}`}
              isRecommendation={isRecommendedFood} // Pass flag to header
              onClose={onClose}
            />
            {/* Recommendation Context */}
            {isRecommendedFood && recommendation && (
              <div className="p-4 border-b bg-green-50">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  Part of Recommendation
                </h4>
                <p className="text-xs text-green-700 mb-3">
                  This food is part of the '
                  <span className="font-semibold">
                    {recommendation.meal.name}
                  </span>
                  ' recommendation (Score: {recommendation.score}). Use the
                  buttons on the card in the calendar to accept or reject the
                  full recommendation.
                </p>
              </div>
            )}

            {/* Standard Food Details */}
            <NutritionalBreakdown info={f.nutritionalInfo} />
            <IngredientList ingredients={f.ingredients} />
            {f.instructions && f.instructions.length > 0 && (
              <InstructionSteps instructions={f.instructions} />
            )}
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
      case "ingredient": {
        const i = displayItem as Ingredient;
        // Check if this selected ingredient belongs to the currently selected recommendation (if any)
        const isRecommendedIngredient =
          recommendation !== null &&
          recommendation.meal.foods.some((recFood) =>
            recFood.ingredients.some(
              (ing) =>
                ing.id === i.id || (!ing.id && !i.id && ing.name === i.name)
            )
          );

        const categoryColor =
          COLOR_SCHEMES.ingredient[
            i.category as keyof typeof COLOR_SCHEMES.ingredient
          ] || "#cccccc";

        return (
          <>
            <DetailHeader
              title={i.name}
              subtitle={`Ingredient (${i.amount} ${i.unit})`}
              isRecommendation={isRecommendedIngredient}
              onClose={onClose}
            />
            {/* Recommendation Context & Accept Button */}
            {isRecommendedIngredient && recommendation && (
              <div className="p-4 border-b bg-green-50">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  Part of Recommendation
                </h4>
                <p className="text-xs text-green-700 mb-3">
                  This ingredient is used in the '
                  <span className="font-semibold">
                    {recommendation.meal.name}
                  </span>
                  ' recommendation. Accepting will save the entire recommended
                  meal.
                </p>
              </div>
            )}
            {/* --- End Recommendation Context --- */}

            {/* Standard Ingredient Details */}
            <div className="p-4 border-b flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: categoryColor }}
              ></div>
              <span className="text-sm font-medium text-gray-700 capitalize">
                Category: {i.category}
              </span>
            </div>
            <NutritionalBreakdown info={i.nutritionalInfo} />
            <div className="p-4 border-b space-y-2">
              <TagsList label="Cultural Origin" tags={i.culturalOrigin} />
              <TagsList label="Allergens" tags={i.allergens} />
              <TagsList label="Substitutes" tags={i.substitutes} />
            </div>
            {/* Add more ingredient-specific details: common uses, storage, etc. */}
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={
              displayType +
              (displayItem as any)?.id +
              currentLevel +
              (isShowingRecommendation ? "rec" : "trace") // Key changes based on recommendation status
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
      <div className="flex-shrink-0 border-t bg-gradient-to-br from-white to-gray-50 p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Daily Nutrition Goals
            </h3>
            <span className="text-xs text-gray-500">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            {/* Calories */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">Calories</span>
                <span className="text-gray-500">
                  {currentNutritionalValues.calories} /{" "}
                  {nutritionalGoals.dailyCalories} kcal
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(
                      (currentNutritionalValues.calories /
                        nutritionalGoals.dailyCalories) *
                        100,
                      100
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
                  {currentNutritionalValues.carbs}
                  {nutritionalGoals.carbohydrates.unit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(
                      (currentNutritionalValues.carbs /
                        nutritionalGoals.carbohydrates.max) *
                        100,
                      100
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
                  {currentNutritionalValues.protein}
                  {nutritionalGoals.protein.unit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(
                      (currentNutritionalValues.protein /
                        nutritionalGoals.protein.max) *
                        100,
                      100
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
                  {currentNutritionalValues.fiber} /{" "}
                  {nutritionalGoals.fiber.daily}
                  {nutritionalGoals.fiber.unit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(
                      (currentNutritionalValues.fiber /
                        nutritionalGoals.fiber.daily) *
                        100,
                      100
                    )}%`,
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
                  (currentNutritionalValues.calories /
                    nutritionalGoals.dailyCalories) *
                    100
                )}%`,
                color: "text-green-500",
              },
              {
                label: "Carbs",
                value: `${Math.round(
                  (currentNutritionalValues.carbs /
                    nutritionalGoals.carbohydrates.max) *
                    100
                )}%`,
                color: "text-blue-500",
              },
              {
                label: "Protein",
                value: `${Math.round(
                  (currentNutritionalValues.protein /
                    nutritionalGoals.protein.max) *
                    100
                )}%`,
                color: "text-purple-500",
              },
              {
                label: "Fiber",
                value: `${Math.round(
                  (currentNutritionalValues.fiber /
                    nutritionalGoals.fiber.daily) *
                    100
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
    </div>
  );
};
