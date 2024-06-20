-- MySQL dump 10.13  Distrib 8.3.0, for macos14.2 (arm64)
--
-- Host: localhost    Database: tat
-- ------------------------------------------------------
-- Server version	8.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `lat` decimal(10,8) NOT NULL,
  `long` decimal(11,8) NOT NULL,
  `type` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `desc` text,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,1,29.64686833,-82.33709333,'library','Norman Hall','My workplace'),(2,1,29.64421833,-82.33938667,'grocer','Road next to Norman hall','Used for demo'),(3,1,29.61720000,-82.37770000,'grocer','BLVD','Home, or atleast it used to be.'),(4,1,29.65355730,-82.33884040,'grocer','Accura','LMAO'),(5,1,29.64501380,-82.34794590,'grocer','Welcome Center','None'),(6,1,29.66702730,-82.31367110,'grocer','Lmao','Resa'),(7,1,29.62305120,-82.37971880,'grocer','TJs','lol');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `user_id` int NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `loc_id` int NOT NULL,
  `device_id` varchar(255) NOT NULL,
  KEY `user_id` (`user_id`),
  KEY `loc_id` (`loc_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`loc_id`) REFERENCES `locations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'2024-06-10 17:15:17',6,'f5TM5YiVSrqqPMAoOsDFy4:APA91bGfm7uNyAGOB59nq9lfsY9QOni7VpIrbJZJWRxl3_DoJD0LHxQToZayMm87gtGLFF2B4wZhbl9v39EIHPgRwwEQSr_vN426c1sB-6ktbjk7xpTHGAP67LERjuzfZTapcQXC45QD'),(1,'2024-06-13 17:14:57',1,'eXZFSsQRRMiim-hVSUEFX8:APA91bGrNIoARuqbkKKKeUee6w-Fh8n9RLWhlcW0IqfZKvfAxOtcz5ixhII6XpdodIEuz76f9NlY9QZFVt5mpcbN7jid63TPyIQghG8nLvFNJ34zk0bSMzuBg3AifLVF79fgMtyrM0Bt'),(1,'2024-06-13 17:16:33',4,'eXZFSsQRRMiim-hVSUEFX8:APA91bGrNIoARuqbkKKKeUee6w-Fh8n9RLWhlcW0IqfZKvfAxOtcz5ixhII6XpdodIEuz76f9NlY9QZFVt5mpcbN7jid63TPyIQghG8nLvFNJ34zk0bSMzuBg3AifLVF79fgMtyrM0Bt'),(1,'2024-06-14 17:19:51',1,'fUijTUq0Q3OGgC2NM7p4X9:APA91bH1DAZlbxI4KH8uMXzih3dnFd5Hs2fwtA4JRLDRzdCC41V4IABfJgOyUHxfXqg-j5E0YPTs52lZNWuEY7t8hFIBe21ZkO56Ux9Q0mNe15pdYgZ29kvjWZN_nQEYvw7KzITz-S4p'),(1,'2024-06-14 17:29:34',4,'fUijTUq0Q3OGgC2NM7p4X9:APA91bH1DAZlbxI4KH8uMXzih3dnFd5Hs2fwtA4JRLDRzdCC41V4IABfJgOyUHxfXqg-j5E0YPTs52lZNWuEY7t8hFIBe21ZkO56Ux9Q0mNe15pdYgZ29kvjWZN_nQEYvw7KzITz-S4p');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `android_token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Arpan','arpnagar1@gmail.com','$2a$10$juMD3ocl40jwyQucGdHLDuzGO2wAirmSjj1W7Uganrlqux.EnWjqm','2024-05-31 19:18:41','fUijTUq0Q3OGgC2NM7p4X9:APA91bH1DAZlbxI4KH8uMXzih3dnFd5Hs2fwtA4JRLDRzdCC41V4IABfJgOyUHxfXqg-j5E0YPTs52lZNWuEY7t8hFIBe21ZkO56Ux9Q0mNe15pdYgZ29kvjWZN_nQEYvw7KzITz-S4p'),(2,'Arpu','arp@test.com','$2a$10$pTOmavYR3ilLqDehp467yuyQZnD0sE66cgN/bzrgpRG9F1YeVYT5u','2024-05-31 19:27:13',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-17 16:33:47
