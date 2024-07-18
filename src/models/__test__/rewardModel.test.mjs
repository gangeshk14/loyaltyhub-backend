import RewardsRecord from '../RewardsRecord.mjs';
import dbPool from '../../config/database.mjs';
import User from '../User.mjs';
import { jest } from '@jest/globals';

jest.mock('../../config/database.mjs');
jest.mock('../User.mjs');

describe('RewardsRecord', () => {
  let mockRecord;

  beforeAll(() => {
    mockRecord = {
      recordID: 'test-1',
      date: new Date(),
      loyaltyProgramID: 'Marriott Bonvoy',
      userID: 'user-1',
      points: 1000,
      rewardType: 'bonus',
      rewardAmount: 5000,
      status: 'REJECTED',
      purpose: 'test-purpose',
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  test('should create a new RewardsRecord instance', async () => {
    User.findById.mockResolvedValue(true);
    RewardsRecord.findByLoyaltyProgramID.mockResolvedValue(true);
    dbPool.query.mockResolvedValue([{ insertId: mockRecord.recordID }]);

    const record = await RewardsRecord.create({
      userID: mockRecord.userID,
      loyaltyProgramID: mockRecord.loyaltyProgramID,
      date: mockRecord.date,
      points: mockRecord.points,
      rewardType: mockRecord.rewardType,
      rewardAmount: mockRecord.rewardAmount,
      status: mockRecord.status,
      purpose: mockRecord.purpose,
    });

    expect(record).toBeInstanceOf(RewardsRecord);
    expect(record.recordID).toBe(mockRecord.recordID);
    expect(record.userID).toBe(mockRecord.userID);
    expect(record.loyaltyProgramID).toBe(mockRecord.loyaltyProgramID);
  });

  test('should find a RewardsRecord by ID', async () => {
    dbPool.query.mockResolvedValue([[mockRecord]]);

    const record = await RewardsRecord.findById(mockRecord.recordID);

    expect(record).toBeInstanceOf(RewardsRecord);
    expect(record.recordID).toBe(mockRecord.recordID);
    expect(record.userID).toBe(mockRecord.userID);
    expect(record.points).toBe(mockRecord.points);
  });

  test('should find RewardsRecords by userID', async () => {
    dbPool.query.mockResolvedValue([[mockRecord]]);

    const records = await RewardsRecord.findByUserID(mockRecord.userID);

    expect(records).toHaveLength(1);
    expect(records[0]).toBeInstanceOf(RewardsRecord);
    expect(records[0].userID).toBe(mockRecord.userID);
  });

  test('should find RewardsRecords by loyaltyProgramID', async () => {
    dbPool.query.mockResolvedValue([[mockRecord]]);

    const records = await RewardsRecord.findByLoyaltyProgramID(mockRecord.loyaltyProgramID);

    expect(records).toHaveLength(1);
    expect(records[0]).toBeInstanceOf(RewardsRecord);
    expect(records[0].loyaltyProgramID).toBe(mockRecord.loyaltyProgramID);
  });

  test('should update the status of a RewardsRecord', async () => {
    dbPool.query.mockResolvedValue([{}]);

    const result = await RewardsRecord.updateStatus(mockRecord.recordID, 'ACCEPTED');

    expect(result).toBe(true);
  });

  test('should throw an error if user does not exist when creating a RewardsRecord', async () => {
    User.findById.mockResolvedValue(false);

    await expect(RewardsRecord.create({
      userID: mockRecord.userID,
      loyaltyProgramID: mockRecord.loyaltyProgramID,
      date: mockRecord.date,
      points: mockRecord.points,
      rewardType: mockRecord.rewardType,
      rewardAmount: mockRecord.rewardAmount,
      status: mockRecord.status,
      purpose: mockRecord.purpose,
    })).rejects.toThrow('User does not exist');
  });

  test('should throw an error if loyalty program does not exist when creating a RewardsRecord', async () => {
    User.findById.mockResolvedValue(true);
    RewardsRecord.findByLoyaltyProgramID.mockResolvedValue(false);

    await expect(RewardsRecord.create({
      userID: mockRecord.userID,
      loyaltyProgramID: mockRecord.loyaltyProgramID,
      date: mockRecord.date,
      points: mockRecord.points,
      rewardType: mockRecord.rewardType,
      rewardAmount: mockRecord.rewardAmount,
      status: mockRecord.status,
      purpose: mockRecord.purpose,
    })).rejects.toThrow('Loyalty Program does not exist');
  });
});
