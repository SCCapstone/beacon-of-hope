import React from "react";

interface FoodTypeIconProps {
  type: "main_course" | "side_dish" | "beverage" | "dessert" | "snack";
  className?: string;
}

export const FoodTypeIcon: React.FC<FoodTypeIconProps> = ({
  type,
  className = "",
}) => {
  // Return the appropriate icon based on food type
  switch (type) {
    case "main_course":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          {/* Fork and knife icon */}
          <path d="M11 3H13V21H11V3ZM5 3C5.55 3 6 3.45 6 4V11C6 12.1 5.1 13 4 13H3V21H1V13H0V4C0 3.45 0.45 3 1 3H5ZM3 11V5H2V11H3ZM5 5H4V11H5V5ZM18 3V7H20C21.1 7 22 7.9 22 9V13C22 14.1 21.1 15 20 15H18V21H16V3H18ZM20 13V9H18V13H20Z" />
        </svg>
      );

    case "side_dish":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          {/* Bowl icon */}
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM7 15H17C17.55 15 18 14.55 18 14C18 11.24 15.76 9 13 9H11C8.24 9 6 11.24 6 14C6 14.55 6.45 15 7 15Z" />
        </svg>
      );

    case "beverage":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          {/* Glass/cup icon */}
          <path d="M3 2L5 20.23C5.13 21.23 5.97 22 7 22H17C18.03 22 18.87 21.23 19 20.23L21 2H3ZM12 19C9.24 19 7 16.76 7 14C7 11.24 9.24 9 12 9C14.76 9 17 11.24 17 14C17 16.76 14.76 19 12 19ZM5 5H19L18.2 9.64C16.91 8.03 14.61 7 12 7C9.39 7 7.09 8.03 5.8 9.64L5 5Z" />
        </svg>
      );

    case "dessert":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          {/* Cake/dessert icon */}
          <path d="M12 6C13.11 6 14 5.1 14 4C14 3.62 13.9 3.27 13.71 2.97L12 0L10.29 2.97C10.1 3.27 10 3.62 10 4C10 5.1 10.9 6 12 6ZM18 9H6C4.34 9 3 10.34 3 12V21C3 21.55 3.45 22 4 22H20C20.55 22 21 21.55 21 21V12C21 10.34 19.66 9 18 9ZM19 20H5V12C5 11.45 5.45 11 6 11H18C18.55 11 19 11.45 19 12V20Z" />
        </svg>
      );

    case "snack":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          {/* Snack/cookie icon */}
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15 9C15 10.1 14.1 11 13 11C13 12.1 12.1 13 11 13C11 14.1 10.1 15 9 15C8.45 15 8 14.55 8 14C8 13.45 8.45 13 9 13C9.55 13 10 12.55 10 12C10 11.45 10.45 11 11 11C11.55 11 12 10.55 12 10C12 9.45 12.45 9 13 9C13.55 9 14 8.55 14 8C14 7.45 14.45 7 15 7C15.55 7 16 7.45 16 8C16 8.55 15.55 9 15 9Z" />
        </svg>
      );

    default:
      return (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      );
  }
};
