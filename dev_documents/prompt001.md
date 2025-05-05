---
项目分析师：

请你帮我看下当前项目，我需要你根据当前项目情况写一份开发说明文档，适用于所有新来的开发人员，无论是从产品经理、后端开发、前端开发、全栈程序员、美术ui、ux、测试工程师的角度进行思考和书写，让所有开发人员通过你写的 @README.md 文件，就可以清楚地了解项目以及对项目进行快速上手开发，包括产品设计、技术栈，美术风格，目录结构等（包括但不限于，我只是举例，希望你能更加完善、更加专业的书写项目说明文档）。如果有问题，可以随时提出，我将为你解答。



---
supabase 架构师：
很好，现在我想让当前项目支持 supabase，请你从项目情况本身出发，作为一个拥有30年开发经验的数据库架构师以及全栈开发工程师，帮我设计一整套适用于当前项目的 数据库结构，
1，
@monorepo-tamagui.mdc 
2， 请时刻review这个文档：@dev_rule_v017.md 
3，参考数据库sql设计（只是思路，无需照抄，需要结合当前项目进行设计）：@final_0429_all_in_one_migration_202407.sql 
4，当前supabase上的已经存在的表：@supabase-schema-hnixjqmjwjfgsignzozs.png 
5，当前supabase相关的key信息：@dev_supabase_key.md 
如果有其他方面需要支持，请你随时告知我。我会很乐意帮助你完成，我们一起做好这个项目。最终将你输出的内容用md文件格式存储到项目的文档文件夹，方便之后进行开发使用。


非常好，我现在希望你能帮我根据我当前的项目 @README.md 情况以及架构，参考 @dev_supabase_db_design_v018.md 这个数据库架构设计，设计出一套适用于当前项目的 sql 迁移文件，方便我初始化supabase 数据库，

同时，我希望你能慎用 drop 以及 delete之类的功能，确保每次sql命令的迁移都不会对原有数据库中的数据造成破坏和丢失，提前做好保护检查。如果有需要我提供的信息，请及时告知。 @dev_rule_v017.md @monorepo-tamagui.mdc sql文件单独存储于一个文件夹下，方便统一管理。




---
IMPLEMENTED SUPABASE IN CURRENT PROJECT:
i create a supabase database, with keys in file @dev_supabase_key.md , please deeply read the project from @README.md to know how the structure the project is and help me to follow the rule @dev_rule_v017.md  to make support the supabase in this project but do not remove the firebase support which implemented already. the target is to make supabase and firebase in parallel in the same project, supabase is used to the user data info and store, the firebase is worked for the login of 3rd party for google auth now, all new user registered in firebase or login via google should be stored in supabase as well. i will also provide you some refer documents for this implementation, you can refer this file @dev_supabase_db_design_v018.md . NOW, please help me to do design what you will do for the implement the supabase function in this project but do not impact the current projejct working normallly. i need you to design it with more details which it can be landed instead of implemented directly until you got the APPROVE from me with "GO WITH IMPLEMENT".