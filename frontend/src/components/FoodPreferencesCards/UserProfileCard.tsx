import React from "react";
// import "./UserProfileCard.css";

const UserProfileCard: React.FC = () => {
  return (
    <div className="user-profile-card">
      <div className="user-info">
        <h2>John Smith</h2>
        <p>Coffee enthusiast ☕ | Living life one brew at a time!</p>
        <p>#CoffeeLover #BrewJoy</p>
      </div>
      <img
        src="/path/to/profile-avatar.png"
        alt="Profile Avatar"
        className="profile-avatar"
      />
    </div>
  );
};

export default UserProfileCard;
