package com.mira

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class MiraApplication

fun main(args: Array<String>) {
    runApplication<MiraApplication>(*args)
}
