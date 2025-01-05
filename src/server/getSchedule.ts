"use server"
import { FullSchedule } from "~/app/models";

export async function getSchedule(affectedClass: string) {
    try {
      const response = await fetch("https://peitenmueller.duckdns.org/timetable/data/?filename=" + affectedClass, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data: FullSchedule = await response.json();
      console.log(data);
      return data;
      
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
      throw error;
    }
  }
  