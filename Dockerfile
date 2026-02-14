#  BUILD STAGE
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /build

# Copy Maven project
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src

# Build the jar
RUN mvn -f backend/pom.xml clean package -DskipTests

#  RUN STAGE
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy jar from build stage
COPY --from=build /build/backend/target/*.jar app.jar

# Render uses PORT env variable
EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
