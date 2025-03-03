import React, { useState } from "react";
//import "../SettingsPages/css/SettingsModals.css";
import "./css/TermsAndConditionsModal.css";

const TermsAndConditionsModal: React.FC = () => {
    return (
        <div className="modal-content">
            <div className="terms-section">
                <section className="terms-intro">
                    <p>
                        Welcome to BEACON of Hope ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your use of our website, which provides AI-based meal recommendations (the "Service").
                    </p>
                    <p>
                        We reserve the right to revise these Terms at any time. If we do, we will post the modified Terms on this page and indicate the date of most the recent change above. You agree to read all notifications we send you and to periodically check this page for updates to these Terms. Your continued use of the Services constitutes acceptance of these Terms and any modifications thereto. If you object to any changes, your sole recourse is to cease use of the Services. 
                    </p>
                </section>
                <section className="terms-part">
                    <h1>WEBSITE OVERVIEW</h1>
                    <p>
                        BEACON of Hope is a context-aware meal recommendation system designed to help users make informed and healthy decisions about their meals. Our system is tailored to individuals with diabetes and those of African-American descent. We provide personalized meal plans by analyzing user preferences, dietary restrictions, and health goals through the use of ontologies.
                    </p>
                    <p style={{marginTop: "10px"}}>
                        <b>Key Features:</b> Personalized meal recommendations based on health conditions and demographics, interactive meal exploration and categorization, visual comparison of nutritional information, health and demographic-aware filtering system, and ontology-based meal classification.
                    </p>
                </section>
                
                <section className="terms-part">
                <h1>USE OF SERVICE</h1>
                    <p>
                        Our Service provides meal recommendations based on user-inputted parameters such as age, height, weight, gender, food preferences, and dietary restrictions. However, users may choose to use the Service without providing any personal data.
                    </p>
                </section>
                <section className="terms-part">
                    <h1>USER DATA AND PRIVACY EXPECTATIONS</h1>
                    <ul>
                        <li>Users have the option to input personal parameters to enhance meal recommendations.</li>
                        <li>Users can delete their stored preferences and data at any time through their account settings.</li>
                        <li>Users can choose not to have any of their data stored on our system.</li>
                        <li>Users can request the deletion of their entire account, which will remove all associated data from our system.</li>
                        <li>All private data will be kept in a secure database and will only be used by the application.</li>
                    </ul>
                </section>
                <section className="terms-part">
                    <h1>PRIVACY AND DATA HANDLING</h1>
                    <p>
                        We take data privacy seriously. Please refer to our [Privacy Policy] for detailed information on how we collect, use, and protect your data.
                    </p>
                </section>
                <section className="terms-part">
                    <h1>ACCURACY OF RECOMMENDATIONS</h1>
                    <p>
                        Our AI-generated meal recommendations are based on user inputs and general dietary knowledge. However, we do not guarantee that the recommendations will always be accurate, suitable, or safe for individual health conditions. Users should consult a qualified healthcare provider or nutritionist before making significant dietary changes.
                    </p>
                </section>
                <section className="terms-part">
                    <h1>MITIGATING BIAS AND DISCRIMINATION</h1>
                    <ul>
                        <li>The application can be utilized in 'demo mode' without user-provided personal information, eliminating any possibility of discrimination in that mode.</li>
                        <li>We assess our application across intended user groups and strive to minimize any unintended harm.</li>
                        <li>While our app features targeted meal recommendations for African-American users with diabetes, we aim to be inclusive by incorporating meal options for all demographics and health conditions.</li>
                        <li>The user interface is designed to be welcoming and accessible while avoiding stereotypes or assumptions.</li>
                    </ul>
                </section>
                <section className="terms-part">
                    <h1>LISCENSING & THIRD-PARTY SOFTWARE</h1>
                    <ul>
                        <li>All data will be obtained ethically and legally, including meal data from freely accessible recipes and open-source datasets.</li>
                        <li>We verify third-party licenses, including React (MIT), Django (BSD-3-Clause), TypeScript, and dependencies via Poetry and Pipx.</li>
                        <li>HIPAA compliance will be confirmed for health data, while demographic data collection will adhere to GDPR or CCPA standards.</li>
                        <li>Ontologies and third-party data will be verified as open-access or licensed, with proper attribution.</li>
                        <li>A Contributor License Agreement (CLA) will be considered to clarify open-source contribution rights.</li>
                    </ul>
                </section>
                <section className="terms-part">
                    <h1>INTELLECTUAL PROPERTY CONSTRAINTS</h1>
                    <ul>
                        <li>The BEACON meal recommendation system has been created in the AI 4 Society Research Group, headed by Professor Biplav Srivastava.</li>
                        <li>All information is available under the MIT license, and individual contributions will be acknowledged.</li>
                        <li>All intellectual property (IP) is available for sharing as per the University of South Carolina policies.</li>
                    </ul>
                </section>
                <section className="terms-part">
                    <h1>USER RESPONSIBILITIES</h1>
                    <p>By using our service you agree to:</p>
                    <ul>
                        <li>Provide accurate information if choosing to input personal data.</li>
                        <li>Use the Service in compliance with applicable laws and regulations.</li>
                        <li>Not misuse, reverse-engineer, or exploit our AI technology.</li>
                    </ul>
                </section>
                <section className="terms-part">
                    <h1>LEGAL COMPLIANCE AND PROHIBITED ACTIVITIES</h1>
                    <ul>
                        <li>Users cannot use our app to break the law, post copyrighted works, or steal information.</li>
                        <li>The app is designed solely for meal recommendations and prohibits users from sharing copyrighted content or accessing unauthorized data.</li>
                        <li>Privacy and copyright policies are enforced to prevent any unlawful use or data misuse.</li>
                    </ul>
                </section>
                <section className="terms-part">
                    <h1>ACCOUNT MANAGEMENT</h1>
                    <ul>
                        <li>Users may create an account to save preferences.</li>
                        <li>Users can delete their account at any time, permanently removing all stored data.</li>
                        <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
                    </ul>
                </section>
                <section className="terms-part">
                    <h1>LIMITATION OF LIABILITY</h1>
                    <p>
                        Our Service is provided "as is" without any warranties, express or implied. We are not liable for any health-related issues, inaccuracies, or consequences arising from the use of our meal recommendations.
                    </p>
                </section>
                <section className="terms-part">
                    <h1>CONTACT US</h1>
                    <p>
                        If you have any questions about these Terms, please contact us at beaconOfHope@gmail.com.
                    </p>
                </section>
                <section className="terms-foot">
                    <p>By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms.</p>
                    <h3 style={{fontWeight:"bold"}}>Last Updated: 02/25/2025</h3>
                </section>
            </div>
        </div>
    );
};

export default TermsAndConditionsModal;