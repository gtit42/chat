import { storage } from "./storage";
import { COUNTRIES } from "@shared/countries";

interface MatchingQueue {
  [countryCode: string]: {
    users: string[];
    lastUpdate: number;
  };
}

class AdvancedMatchingSystem {
  private queue: MatchingQueue = {};
  private serverRegions: Map<string, string[]> = new Map();
  
  constructor() {
    this.initializeServerRegions();
  }

  private initializeServerRegions() {
    // تقسيم الدول على المناطق للتوزيع الأمثل
    this.serverRegions.set("middle-east", [
      "SA", "AE", "EG", "JO", "LB", "SY", "IQ", "KW", "QA", "BH", "OM", "YE"
    ]);
    this.serverRegions.set("north-africa", [
      "MA", "TN", "LY", "DZ", "SD"
    ]);
    this.serverRegions.set("europe", [
      "GB", "FR", "DE", "IT", "ES", "NL", "BE", "CH", "AT", "SE", "NO", "DK"
    ]);
    this.serverRegions.set("north-america", [
      "US", "CA", "MX"
    ]);
    this.serverRegions.set("asia-pacific", [
      "CN", "JP", "KR", "IN", "AU", "NZ", "SG", "MY", "TH", "VN", "PH"
    ]);
    this.serverRegions.set("south-america", [
      "BR", "AR", "CL", "CO", "PE", "VE"
    ]);
    this.serverRegions.set("africa", [
      "NG", "ZA", "KE", "GH", "ET", "UG", "TZ"
    ]);
  }

  async findMatch(userId: string, countryCode: string): Promise<string | null> {
    try {
      // 1. البحث في نفس الدولة أولاً
      let match = await this.findUserInCountry(userId, countryCode);
      if (match) return match;

      // 2. البحث في نفس المنطقة
      const region = this.getRegionForCountry(countryCode);
      if (region) {
        const regionCountries = this.serverRegions.get(region) || [];
        for (const country of regionCountries) {
          if (country !== countryCode) {
            match = await this.findUserInCountry(userId, country);
            if (match) return match;
          }
        }
      }

      // 3. البحث عالمياً
      match = await this.findUserInCountry(userId, "any");
      if (match) return match;

      // 4. إضافة المستخدم إلى القائمة إذا لم يجد أحد
      await this.addUserToQueue(userId, countryCode);
      return null;

    } catch (error) {
      console.error("خطأ في نظام المطابقة:", error);
      return null;
    }
  }

  private async findUserInCountry(excludeUserId: string, countryCode: string): Promise<string | null> {
    const waitingUser = await storage.findWaitingUser(countryCode, excludeUserId);
    return waitingUser?.userId || null;
  }

  private getRegionForCountry(countryCode: string): string | null {
    for (const [region, countries] of this.serverRegions.entries()) {
      if (countries.includes(countryCode)) {
        return region;
      }
    }
    return null;
  }

  private async addUserToQueue(userId: string, countryCode: string): Promise<void> {
    if (!this.queue[countryCode]) {
      this.queue[countryCode] = {
        users: [],
        lastUpdate: Date.now()
      };
    }

    if (!this.queue[countryCode].users.includes(userId)) {
      this.queue[countryCode].users.push(userId);
      this.queue[countryCode].lastUpdate = Date.now();
    }
  }

  async removeUserFromQueue(userId: string): Promise<void> {
    for (const countryCode in this.queue) {
      const index = this.queue[countryCode].users.indexOf(userId);
      if (index > -1) {
        this.queue[countryCode].users.splice(index, 1);
        this.queue[countryCode].lastUpdate = Date.now();
      }
    }
  }

  // تنظيف القوائم من المستخدمين القدامى
  cleanupStaleQueues(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 دقائق

    for (const countryCode in this.queue) {
      if (now - this.queue[countryCode].lastUpdate > maxAge) {
        this.queue[countryCode].users = [];
      }
    }
  }

  getQueueStats(): { [countryCode: string]: number } {
    const stats: { [countryCode: string]: number } = {};
    for (const countryCode in this.queue) {
      stats[countryCode] = this.queue[countryCode].users.length;
    }
    return stats;
  }

  // توزيع الحمولة على السيرفرات
  async getOptimalServer(countryCode: string): Promise<any> {
    try {
      const server = await storage.findOptimalServer(countryCode);
      if (server) {
        // تحديث حمولة السيرفر
        await storage.updateServerLoad(server.id, server.currentLoad + 1);
        return server;
      }
      return null;
    } catch (error) {
      console.error("خطأ في العثور على السيرفر الأمثل:", error);
      return null;
    }
  }
}

export const matchingSystem = new AdvancedMatchingSystem();

// تنظيف دوري للقوائم
setInterval(() => {
  matchingSystem.cleanupStaleQueues();
}, 60000); // كل دقيقة