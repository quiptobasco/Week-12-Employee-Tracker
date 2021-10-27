// importing libraries
const inquirer = require('inquirer');
const mysql = require('mysql2');
require('console.table');
require('dotenv').config();

// create connection to db
const connection = mysql.createConnection(
    {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: 'company_db'
    }
);

// connect to db and call prompt to start
connection.connect((err) => {
    if (err) throw err;
    prompt();
});

// questions to be asked
const promptMessages = {
    viewAllDepartments: `View all departments`,
    viewAllRoles: `View all roles`,
    viewAllEmployees: `View all employees`,
    addDepartment: `Add a department`,
    addRole: `Add a role`,
    addEmployee: `Add an employee`,
    updateRole: `Update an employee's role`,
    updateManager: `Update an employee's manager`,
    viewEmployeesByManager: `View employees by manager`,
    deleteDepartment: `Delete a department`,
    deleteRole: `Delete a role`,
    deleteEmployee: `Delete an employee`,
    viewBudgetByDepartment: `View budget of a department`,
    quit: `Quit` 
};

// prompt function, main menu
function prompt() {
    inquirer.prompt({
        name: 'action',
        type: 'list',
        message: 'What would you like to do?',
        choices: [
            promptMessages.addDepartment,
            promptMessages.addEmployee,
            promptMessages.addRole,
            promptMessages.deleteDepartment,
            promptMessages.deleteEmployee,
            promptMessages.deleteRole,
            promptMessages.updateManager,
            promptMessages.updateRole,
            promptMessages.viewAllDepartments,
            promptMessages.viewAllEmployees,
            promptMessages.viewAllRoles,
            promptMessages.viewBudgetByDepartment,
            promptMessages.viewEmployeesByManager,
            promptMessages.quit
        ]
    }).then(answer => {
        switch (answer.action) {
            case promptMessages.viewAllDepartments:
                viewAllDepartments();
                break;
            case promptMessages.viewAllRoles:
                viewAllRoles();
                break;
            case promptMessages.viewAllEmployees:
                viewAllEmployees();
                break;
            case promptMessages.addDepartment:
                addDepartment();
                break;
            case promptMessages.addRole:
                addRole();
                break;
            case promptMessages.addEmployee:
                addEmployee();
                break;
            case promptMessages.updateRole:
                updateRole();
                break;
            case promptMessages.updateManager:
                updateManager();
                break;
            case promptMessages.viewEmployeesByManager:
                viewEmployeesByManager();
                break;
            case promptMessages.deleteDepartment:
                deleteDepartment();
                break;
            case promptMessages.deleteRole:
                deleteRole();
                break;
            case promptMessages.deleteEmployee:
                deleteEmployee();
                break;
            case promptMessages.viewBudgetByDepartment:
                viewBudgetByDepartment();
                break;
            case promptMessages.quit:
                connection.end();
                break;
            };
        });
};

// function to query DB and show all columns from departments table
function viewAllDepartments() {
    const sql = 'SELECT * FROM departments';
    connection.query(sql, (err, res) => {
        if (err) throw err;
        console.table(res);
        prompt();
    });
};

// function to query DB and inner join from roles table to show all roles
function viewAllRoles() {
    const sql = `SELECT roles.title, roles.id, departments.name AS department, roles.salary
    FROM roles
    JOIN departments ON roles.department_id = departments.id
    ORDER BY roles.id;`;
    connection.query(sql, function(err, res) {
        if (err) throw err;
        console.table(res);
        prompt();
    });
};

// function to query DB and inner join from employees table to show all employees 
function viewAllEmployees() {
    const sql = `SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name AS department, roles.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
    FROM employees
    LEFT JOIN employees manager ON manager.id = employees.manager_id
    INNER JOIN roles ON roles.id = employees.role_id
    INNER JOIN departments ON departments.id = roles.department_id
    ORDER BY employees.id;`;
    connection.query(sql, function(err, res) {
        if (err) throw err;
        console.table(res);
        prompt();
    });
};

// function to query DB and use various joins to show all managers and the employees who work under them 
function viewEmployeesByManager() {
    const sql = `SELECT CONCAT(manager.first_name, ' ', manager.last_name) AS manager, departments.name AS department, employees.id, employees.first_name, employees.last_name, roles.title
    FROM employees
    LEFT JOIN employees manager on manager.id = employees.manager_id
    INNER JOIN roles ON (roles.id = employees.role_id && employees.manager_id != 'NULL')
    INNER JOIN departments ON (departments.id = roles.department_id)
    ORDER BY manager;`;
    connection.query(sql, (err, res) => {
        if (err) throw err;
        console.table(res);
        prompt();
    });
};

// function to prompt user for name of new department and then query DB to add to departments table 
async function addDepartment() {
    const answer = await inquirer.prompt([
        {
            type: 'input',
            name: 'department',
            message: 'What is the name of the department?'
        }
    ]);
    console.log(`Added ${answer.department} to the database`);
    connection.query(
        `INSERT INTO departments SET ?`,
        {
            name: `${answer.department}`
        },
        (err, res) => {
            if (err) throw err;
            prompt();
        });
};

// function to prompt user for name and salary of new role and then query DB to add to roles table
async function addRole() {
    const newRole = await inquirer.prompt([
        {
            name: 'title',
            type: 'input',
            message: 'What is the name of the role?'
        },
        {
            name: 'salary',
            type: 'input',
            message: 'What is the salary of the role?'
        }
    ]);
    connection.query(`SELECT departments.id, departments.name FROM departments ORDER BY departments.id;`, async (err, res) => {
        if (err) throw err;
        const { department } = await inquirer.prompt([
            {
                name: 'department',
                type: 'list',
                choices: () => res.map(res => res.name),
                message: 'Which department does the role belong to?'
            }
        ]);
        let departmentId;
        for (const data of res) {
            if (data.name === department) {
                departmentId = data.id;
                continue;
            }
        };
        console.log(`Added role to the database`);
        connection.query(
            'INSERT INTO roles SET ?',
            {
                title: `${newRole.title}`,
                salary: `${newRole.salary}`,
                department_id: departmentId
            },
            (err, res) => {
                if (err) throw err;
                prompt();
            }
        );
    });
};

// function to prompt user for first_name, last_name, and role of new employee and then query DB to add to employees table
async function addEmployee() {
    const employee = await inquirer.prompt([
        {
            name: 'first_name',
            type: 'input',
            message: `What is the employee's first name?`
        },
        {
            name: 'last_name',
            type: 'input',
            message: `What is the employee's last name?`
        }
    ]);
    connection.query('SELECT roles.id, roles.title FROM roles ORDER BY roles.id;', async (err, res) => {
        if (err) throw err;
        const { role } = await inquirer.prompt([
            {
                name: 'role',
                type: 'list',
                choices: () => res.map(res => res.title),
                message: `What is the employee's role?`
            }
        ]);
        let roleId;
        for (const data of res) {
            if (data.title === role) {
                roleId = data.id;
                continue;
            }
        };
        connection.query('SELECT * FROM employees', async (err, res) => {
            if (err) throw err;
            let choices = res.map(res => `${res.first_name} ${res.last_name}`);
            choices.push('None');
            let { manager } = await inquirer.prompt([
                {
                    name: 'manager',
                    type: 'list',
                    choices: choices,
                    message: `Who is the employee's manager?`
                }
            ]);
            let managerId;
            let managerName;
            if (manager === 'None') {
                managerId = null;
            } else {
                for (const data of res) {
                    data.fullName = `${data.first_name} ${data.last_name}`;
                    if (data.fullName === manager) {
                        managerId = `${data.id}`;
                        managerName = `${data.fullName}`;
                        continue;
                    }
                }
            };
            console.log(`Added ${employee.first_name} ${employee.last_name} to the database`);
            connection.query(
                'INSERT INTO employees SET ?',
                {
                    first_name: `${employee.first_name}`,
                    last_name: `${employee.last_name}`,
                    role_id: roleId,
                    manager_id: managerId  
                },
                (err, res) => {
                    if (err) throw err;
                    prompt();
                }
            );
        });
    });
};

// function to prompt user for which employee to update and which role to assign the employee and then query DB to add to
// update employees table with new role
async function updateRole() {
    connection.query(`SELECT employees.id, employees.first_name, employees.last_name FROM employees;`, async (err, res) => {
        if (err) throw err;
        const { employee } = await inquirer.prompt([
            {
                name: 'employee',
                type: 'list',
                choices: () => res.map(res => `${res.first_name} ${res.last_name}`),
                message: `Select the employee who you want to update their role`
            }
        ]);
        let employeeId;
        for (const data of res) {
            data.fullName = `${data.first_name} ${data.last_name}`;
            if (data.fullName === employee) {
                employeeId = data.id;
                continue;
            }
        };
        connection.query(`SELECT roles.id, roles.title FROM roles;`, async (err, res) => {
            if (err) throw err;
            const { role } = await inquirer.prompt([
                {
                    name: 'role',
                    type: 'list',
                    choices: () => res.map(res => res.title),
                    message: 'Which role do you want to assign the selected employee?'
                }
            ]);
            let roleId;
            for (const data of res) {
                if (data.title === role) {
                    roleId = data.id;
                    continue;
                }
            };
            console.log(`Updated employee's role`);
            connection.query(`UPDATE employees SET role_id = ${roleId} WHERE employees.id = ${employeeId};`, async (err, res) => {
                if (err) throw err;
                prompt();
            });
        });
    });
};

// function to prompt user for which employee to update and which manager to assign the employee and then query DB to add to
// update employees table with new manager
async function updateManager() {
    connection.query(`SELECT employees.id, employees.first_name, employees.last_name FROM employees;`, async (err, res) => {
        if (err) throw err;
        let managerChoices = res.map(res => `${res.first_name} ${res.last_name}`);
        managerChoices.push('None');
        const { employee } = await inquirer.prompt([
            {
                name: 'employee',
                type: 'list',
                choices: () => res.map(res => `${res.first_name} ${res.last_name}`),
                message: `Select the employee who you want to update their manager`
            }
        ]);
        let employeeId;
        for (const data of res) {
            data.fullName = `${data.first_name} ${data.last_name}`;
            if (data.fullName === employee) {
                employeeId = data.id;
                continue;
            }
        };
        const { manager } = await inquirer.prompt([
            {
                name: 'manager',
                type: 'list',
                choices: managerChoices,
                message: `Select the new manager`
            }
        ]);
        let managerId;
        if (manager === 'None') {
            console.log(managerChoices);
            managerId = null;
        } else {
            console.log(managerChoices);
            for (const data of res) {
                data.fullName = `${data.first_name} ${data.last_name}`;
                if (data.fullName === manager) {
                    managerId = data.id;
                    continue;
                }
            }
        };
        console.log(`Updated the employee's manager`);
        connection.query(`UPDATE employees SET manager_id = ${managerId} WHERE employees.id = ${employeeId};`, async (err, res) => {
            if (err) throw err;
            prompt();
        });
    });
};



async function deleteDepartment() {
    connection.query(`SELECT * FROM departments;`, async (err, res) => {
        if (err) throw err;
        const { department } = await inquirer.prompt([
            {
                name: 'department',
                type: 'list',
                choices: () => res.map(res => `${res.name}`),
                message: 'Select the department to delete:'
            }
        ]);
        let departmentId;
        for (const data of res) {
            if (data.name === department) {
                departmentId = data.id;
                continue;
            }
        };
        const sql = `DELETE FROM departments WHERE id = ${departmentId};`;
        connection.query(sql, function(err, res) {
            if (err) throw err;
            console.log(`Deleted department`);
            prompt();
        });
    });
};

async function deleteRole() {
    connection.query(`SELECT * FROM roles;`, async (err, res) => {
        if (err) throw err;
        const { role } = await inquirer.prompt([
            {
                name: 'role',
                type: 'list',
                choices: () => res.map(res => `${res.title}`),
                message: 'Select the role to delete:'
            }
        ]);
        let roleId;
        for (const data of res) {
            if (data.title === role) {
                roleId = data.id;
                continue;
            }
        };
        const sql = `DELETE FROM roles WHERE id = ${roleId};`;
        connection.query(sql, function(err, res) {
            if (err) throw err;
            console.log(`Deleted role`);
            prompt();
        });
    });
};

async function deleteEmployee() {
    connection.query(`SELECT * FROM employees;`, async (err, res) => {
        if (err) throw err;
        const { employee } = await inquirer.prompt([
            {
                name: 'employee',
                type: 'list',
                choices: () => res.map(res => `${res.first_name} ${res.last_name}`),
                message: 'Select the employee to delete:'
            }
        ]);
        let employeeId;
        for (const data of res) {
            data.fullName = `${data.first_name} ${data.last_name}`;
            if (data.fullName === employee) {
                employeeId = data.id;
                continue;
            }
        };
        const sql = `DELETE FROM employees WHERE id = ${employeeId};`;
        connection.query(sql, function(err, res) {
            if (err) throw err;
            console.log(`Deleted employee`);
            prompt();
        });
    });
};

async function viewBudgetByDepartment() {
    connection.query(`SELECT * from departments;`, async (err, res) => {
        if (err) throw err;
        const { department } = await inquirer.prompt([
            {
                name: 'department',
                type: 'list',
                choices: () => res.map(res => `${res.name}`),
                message: 'Which department would you like to view the budget for?'
            }
        ]);
        let departmentId;
        for (const data of res) {
            if(data.name === department) {
                departmentId = data.id;
                continue;
            }
        };
        const sql = `SELECT departments.name AS department, SUM(roles.salary) AS budget
        FROM employees
        LEFT JOIN roles
        ON employees.role_id = roles.id
        LEFT JOIN departments
        ON departments.id = roles.department_id
        GROUP BY departments.name
        HAVING departments.name = ?;`;
        connection.query(sql, department, function (err, res) {
            if (err) throw err;
            console.table(res);
            prompt();  
        });
    });
};