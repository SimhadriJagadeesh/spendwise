package com.spendwise;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        loadDotEnvIfPresent();
        SpringApplication.run(BackendApplication.class, args);
    }

    private static void loadDotEnvIfPresent() {
        List<Path> candidates = List.of(
            Paths.get(".env"),
            Paths.get("../.env"),
            Paths.get("../../.env")
        );
        for (Path p : candidates) {
            if (Files.isRegularFile(p)) {
                try {
                    List<String> lines = Files.readAllLines(p);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                            continue;
                        }
                        int eq = line.indexOf('=');
                        String key = line.substring(0, eq).trim();
                        String val = line.substring(eq + 1).trim();
                        String currentEnv = System.getenv(key);
                        String currentProp = System.getProperty(key);
                        boolean isUnset = (currentEnv == null || currentEnv.isBlank()) &&
                                          (currentProp == null || currentProp.isBlank());
                        if (isUnset) {
                            System.setProperty(key, val);
                        }
                    }
                    break;
                } catch (IOException ignored) {}
            }
        }
    }
}
