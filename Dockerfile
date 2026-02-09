# BUILD STAGE
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /build

# Copy everything
COPY . .

# Build the Spring Boot app
RUN mvn -f demo/pom.xml clean package -DskipTests


# RUN STAGE
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy jar from build stage
COPY --from=build /build/demo/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
