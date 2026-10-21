# Multi-stage Dockerfile for Spendwise Backend (Backend Directory Level)
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/spendwise-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080 10000
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
