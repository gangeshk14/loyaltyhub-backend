import dbPool from "../../config/database.mjs";
import RewardsRecord from "../RewardsRecord.mjs";
import User from "../User.mjs";
import crypto from "crypto";

async function getProgramId(loyaltyProgramName) {
  const getProgramIdQuery = `
SELECT BIN_TO_UUID(programID) AS programID FROM loyaltyprogram WHERE name = ?
`;
  const [resultProgramId] = await dbPool.query(getProgramIdQuery, [loyaltyProgramName]);
  return resultProgramId[0].programID;
}
describe('Rewards Record', () => {
  let testRewardModel;
  let testUsers;
  let testLoyaltyPrograms;

  // Convenient test-helper function to create RewardRecord with a passed in uuid
  async function createWithID({ recordID, userID, loyaltyProgramID, date, points,notified, rewardType, rewardAmount, statuscode, purpose }) {
    const query = `
            INSERT INTO RewardsRecord (recordID, Date, LoyaltyProgramID, UserID, Points, rewardType, rewardAmount, Statuscode, Purpose)
            VALUES (UUID_TO_BIN(?), ?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?)
        `;
    await dbPool.query(query, [recordID, date, loyaltyProgramID, userID, points, rewardType, rewardAmount, statuscode, purpose])
  }

  beforeAll(async () => {
    await dbPool.query(`INSERT INTO statuscode (code, description) VALUES
    ('0000', 'success'),
        ('0001', 'member not found'),
        ('0002', 'member name mismatch'),
        ('0003', 'member account closed'),
        ('0004', 'member account suspended'),
        ('0005', 'member ineligible for accrual'),
        ('0006', 'submitted'),
        ('0007', 'processing'),
        ('0099', 'unable to process, please contact support for more information');
        `)
    testUsers = {
      User1: await User.create({
        userName: 'User1',
        password: 'User1@',
        firstName: 'User@1',
        lastName: '1User',
        membershipType: 'basic',
        mobileNumber: '98654321',
        email: 'testy@testy.com',
      }),
      User2: await User.create({
        userName: 'User2',
        password: 'User2@',
        firstName: 'User@2',
        lastName: '2User',
        membershipType: 'basic',
        mobileNumber: '98654322',
        email: 'testy2@testy.com',
      }),
    }
    testLoyaltyPrograms = {
      Program1: await dbPool.query(`INSERT INTO loyaltyprogram (
        name,
        code,
        description,
        category,
        subCategory,
        currencyName,
        currencyRate,
        company,
        enrollmentLink
    ) VALUES
    (
      'Test Program Name 1',
      'TE',
      'This is a test description for the first loyalty program.',
      'TRAVEL',
      'HOTEL',
      'Test Currency 1',
      1.5,
      'Test Company 1',
      'https://www.testenrollmentlink1.com'
    );`),
      Program2: await dbPool.query(`INSERT INTO loyaltyprogram (
        name,
        code,
        description,
        category,
        subCategory,
        currencyName,
        currencyRate,
        company,
        enrollmentLink
    ) VALUES
    (
      'Test Program Name 2',
      'TE',
      'This is a test description for the second loyalty program.',
      'TRAVEL',
      'AIRLINE',
      'Test Currency 2',
      2.0,
      'Test Company 2',
      'https://www.testenrollmentlink2.com'
    );`),
    }
    testRewardModel = {
      recordID: crypto.randomUUID(),
      date: new Date("2024-01-01"),
      loyaltyProgramID: await getProgramId('Test Program Name 1'),
      userID: testUsers.User1.userID,
      points: 0,
      notified:0,
      rewardType: 'testreward',
      rewardAmount: 5000,
      statuscode: '0006',
      purpose: 'testReward',
    }
    await createWithID(testRewardModel);
  });
  afterAll(async () => {
    await dbPool.query(`DROP DATABASE lhdbtest`);
    await dbPool.query(`CREATE DATABASE lhdbtest`);
    await dbPool.end();
  });

  test('should create new record', async () => {
    const expected = await RewardsRecord.create({
      loyaltyProgramId: await getProgramId('Test Program Name 2'),
      userID: testUsers.User2.userID,
      points: 10,
      rewardType: 'testtype2',
      rewardAmount: 50,
      statusCode: '0006',
      purpose: 'testPurposes2'
    });
    expect(expected?.recordID).not.toBeNull();
    const [actual] = await RewardsRecord.findByUserID(expected.userID);
    //expect({ ...actual, recordID: undefined }).toEqual(expected);
  });

  test('should find record by id', async () => {
    const record = await RewardsRecord.findById(testRewardModel.recordID);
    expect(record).toBeInstanceOf(RewardsRecord);
    expect(record).toEqual(testRewardModel);
  });

  test('should find records by userID', async () => {
    const [foundRecordbyUserId] = await RewardsRecord.findByUserID(testRewardModel.userID);
    expect(foundRecordbyUserId).toBeInstanceOf(RewardsRecord);
    expect(foundRecordbyUserId).toEqual(testRewardModel);
  });
  test('should find records by loyaltyProgramID', async () => {
    const [foundRecordbyLoyaltyProgramId] = await RewardsRecord.findByLoyaltyProgramID(testRewardModel.loyaltyProgramID);
    expect(foundRecordbyLoyaltyProgramId).toBeInstanceOf(RewardsRecord);
    expect(foundRecordbyLoyaltyProgramId).toEqual(testRewardModel);
  });
  test('should update rewardsRecord Status', async () => {
    const isUpdatedRecordStatus = await RewardsRecord.updateStatus(testRewardModel.recordID, '0006');
    const updatedRecord = await RewardsRecord.findById(testRewardModel.recordID);
    expect(isUpdatedRecordStatus).toBe(true);
    expect(updatedRecord.statuscode).toEqual('0006');
  });
});
