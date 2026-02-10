#  BUILD STAGE
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /build

# Copy Maven project
COPY demo/pom.xml demo/pom.xml
COPY demo/src demo/src

# Build the jar
RUN mvn -f demo/pom.xml clean package -DskipTests

#  RUN STAGE
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy jar from build stage
COPY --from=build /build/demo/target/*.jar app.jar

# Render uses PORT env variable
EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
