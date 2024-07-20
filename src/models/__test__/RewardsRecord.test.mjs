import dbPool from "../../config/database.mjs";
import RewardsRecord from "../RewardsRecord.mjs";

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
  beforeAll(async () => {
    const rewardsRecordData = {
      date: new Date(),
      loyaltyProgramID: await getProgramId('Test Program'),
      userID: await getUserId('testUser'),
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
    await dbPool.end();
  });

  test('should create new record', async () => {
    const expected = await RewardsRecord.create({
      date: new Date(),
      loyaltyProgramID: await getProgramId('Premium Rewards'),
      userID: await getUserId('testboy'),
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
