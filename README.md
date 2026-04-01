# The Curated Crate

The Curated Crate is a full-stack e-commerce web application. The frontend is built with vanilla HTML, CSS, and JavaScript, while the backend is powered by Java Spring Boot, utilizing Spring Security, JWT authentication, and Spring Data JPA to connect to a relational database (MySQL/H2).

## Features

- **User Authentication**: Secure signup and login flows utilizing JSON Web Tokens (JWT).
- **Product Catalog**: Browse products dynamically loaded from the backend.
- **Shopping Cart**: Add, remove, and update quantities of items before checking out.
- **Checkout Process**: Secure and streamlined order placement and validation.
- **User Profiles**: View order history and manage account details.
- **Responsive Design**: Custom CSS ensuring a premium experience across devices.

## Technology Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript (ES6)
- LocalStorage (previously for state management, now migrated to API integration)

### Backend
- **Java 21**
- **Spring Boot 3.x**
- **Spring Security** (with Custom JWT Filters)
- **Spring Data JPA** (Hibernate)
- **MySQL / H2 Database**
- **Lombok**
- **Maven**

## Project Structure

The project is structured as a standard Maven Spring Boot application. The frontend assets are served as static files from the application's resources directory:

- `shop/src/main/resources/static/` - Contains all HTML, CSS, and JavaScript files for the frontend.
- `shop/src/main/java/` - Contains the Java backend source code.
- `shop/src/main/resources/application.properties` - Application configurations (database, JWT, etc.).
- `shop/pom.xml` - Maven dependencies.

## Getting Started

### Prerequisites
- [Java 21 JDK](https://adoptium.net/) or higher.
- [Maven](https://maven.apache.org/) 3.8+ (Or use the included Maven wrapper `mvnw`).
- (Optional) MySQL Server if you intend to run with a persistent database profile.

### Running the Application Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YourUsername/the-curated-crate.git
   cd the-curated-crate/shop
   ```

2. **Configure Database**: 
   Depending on your active Spring profile (`application.properties`), the application might use H2 or MySQL. To test it out of the box with H2, simply proceed. For MySQL, ensure your database server is running and update `shop/src/main/resources/application.properties` with your credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/your_db_name
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Build the project**:
   ```bash
   mvn clean install
   ```

4. **Run the Spring Boot application**:
   ```bash
   mvn spring-boot:run
   ```

5. **Access the application**: 
   Open your browser and navigate to `http://localhost:8080/home.html` (port 8080 is default unless changed in properties).
