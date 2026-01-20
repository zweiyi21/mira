# Build stage
FROM gradle:8.5-jdk17 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts gradle.properties ./
COPY src ./src
RUN gradle build -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user and uploads directory
RUN addgroup -S mira && adduser -S mira -G mira && \
    mkdir -p /app/uploads && \
    chown -R mira:mira /app

# Copy built jar
COPY --from=build --chown=mira:mira /app/build/libs/*.jar app.jar

USER mira

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
