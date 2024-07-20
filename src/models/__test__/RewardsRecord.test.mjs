import dbPool from "../../config/database.mjs";
import RewardsRecord from "../RewardsRecord.mjs";
import User from "../User.mjs";
import LoyaltyProgram from "../LoyaltyProgram.mjs";

async function getUserId(username) {
  const getUserIdQuery = `
SELECT BIN_TO_UUID(userid) AS userID FROM user WHERE userName = ?
`;
  const [resultUserId] = await dbPool.query(getUserIdQuery, [username]);
  return resultUserId[0].userID;
}
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
  beforeAll(async () => {
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
      'This is a test description for the second loyalty program.',
      'TRAVEL',
      'AIRLINE',
      'Test Currency 2',
      2.0,
      'Test Company 2',
      'https://www.testenrollmentlink2.com'
    );`),
    }
    const rewardsRecordData = {
      date: new Date(),
      loyaltyProgramID: await getProgramId('Test Program Name 1'),
      userID: testUsers.User1.userID,
      points: 0,
      rewardType: 'testreward',
      rewardAmount: 5000,
      status: 'SUCCESSFUL',
      purpose: 'testReward',
    }
    testRewardModel = await RewardsRecord.create(rewardsRecordData);
  });
  afterAll(async () => {
    await dbPool.query(` DELETE FROM rewardsrecord`);
    await dbPool.query(` DELETE FROM loyaltyprogram`);
    await dbPool.query(` DELETE FROM user`);
    await dbPool.end();
  });

  test('should create new record', async () => {
    const expected = await RewardsRecord.create({
      date: new Date(),
      loyaltyProgramID: await getProgramId('Test Program Name 2'),
      userID: testUsers.User2.userID,
      points: 10,
      rewardType: 'testtype2',
      rewardAmount: 50,
      status: 'REJECTED',
      purpose: 'testPurposes2'
    });
    expect(expected?.recordID).not.toBeNull();
    const actual = await RewardsRecord.findById(expected.recordID);
    expect({ ...actual, date: null }).toEqual({ ...expected, date: null });
  });
  test('should find recordBy recordID', async () => {
    const foundRecordbyId = await RewardsRecord.findById(testRewardModel.recordID);
    expect(foundRecordbyId).toBeInstanceOf(RewardsRecord);
    expect({ ...foundRecordbyId, date: null }).toEqual({ ...testRewardModel, date: null });
  });
  test('should find recordBy userID', async () => {
    const foundRecordbyUserId = await RewardsRecord.findByUserID(testRewardModel.userID);
    expect(foundRecordbyUserId).toBeInstanceOf(RewardsRecord);
    expect({ ...foundRecordbyUserId, date: null }).toEqual({ ...testRewardModel, date: null });
  });
  test('should find recordBy loyaltyProgramID', async () => {
    const foundRecordbyLoyaltyProgramId = await RewardsRecord.findByLoyaltyProgramID(testRewardModel.loyaltyProgramID);
    expect(foundRecordbyLoyaltyProgramId).toBeInstanceOf(RewardsRecord);
    expect({ ...foundRecordbyLoyaltyProgramId, date: null }).toEqual({ ...testRewardModel, date: null });
  });
});
