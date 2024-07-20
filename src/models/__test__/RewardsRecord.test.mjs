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
    await dbPool.end();
  });
  let foundRecordbyId;

  test('should create new record', async () => {
    const newRecord = await RewardsRecord.create({ date: new Date(), loyaltyProgramID: await getProgramId('Premium Rewards'), userID: await getUserId('testboy'), points: 10, rewardType: 'testtype2', rewardAmount: 50, status: 'REJECTED', purpose: 'testPurposes2' });
    console.log(newRecord[0]);
    expect(newRecord).not.toBeNull();
    expect(newRecord[0]).toBeInstanceOf(RewardsRecord);
  });
  test('should find recordByID', async () => {
    foundRecordbyId = await RewardsRecord.findById(testRewardModel.recordID);
    console.log(foundRecordbyId);
    expect(foundRecordbyId).toBeInstanceOf(RewardsRecord);
  });
});
