import { mock } from "bun:test";
import * as mockDataService from "./src/services/__mocks__/dataService";

mock.module("./src/services/dataService", () => mockDataService);
