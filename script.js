let initial_investment,
    sales_revenue,
    labour_materials_cost,
    electricity_cost,
    scrap_value,
    advertising_cost,
    years_advertising,
    sales_revenue_inflation,
    labour_materials_inflation,
    electricity_inflation,
    advertising_inflation,
    general_inflation,
    working_capital,
    tax_rate,
    real_cost_of_capital,
    capital_allowance,
    project_length,
    nominal_cost_of_capital

function Submit() {
    initial_investment = document.getElementById("initial-investment").value;
    sales_revenue = document.getElementById("sales-revenue").value;
    labour_materials_cost = document.getElementById("labour-materials-cost").value;
    electricity_cost = document.getElementById("electricity-cost").value;
    scrap_value = document.getElementById("scrap-value").value;
    advertising_cost = document.getElementById("advertising").value;
    years_advertising = document.getElementById("advertising-length").value;
    sales_revenue_inflation = 1 + (document.getElementById("sales-revenue-inflation").value / 100);
    labour_materials_inflation = 1 + (document.getElementById("labour-materials-inflation").value / 100);
    electricity_inflation = 1 + (document.getElementById("electricity-inflation").value / 100);
    advertising_inflation = 1 + (document.getElementById("advertising-inflation").value / 100);
    general_inflation = 1 + (document.getElementById("general-inflation").value / 100);
    working_capital = document.getElementById("working-capital").value;
    tax_rate = document.getElementById("corporation-tax").value / 100;
    real_cost_of_capital = 1 + (document.getElementById("cost-of-capital").value / 100);
    capital_allowance = document.getElementById("capital-allowance").value / 100;
    project_length = document.getElementById("project-length").value;

    nominal_cost_of_capital = real_cost_of_capital * general_inflation; // of the form 1.x where x is ncoc

    Calculate();
}

function Calculate() {
    let capital_NPV = [];
    capital_NPV[0] = (-1 * initial_investment);
    capital_NPV[project_length] = parseInt(scrap_value);

    let working_capital_NPV = [];
    working_capital_NPV[0] = (-1 * working_capital);
    working_capital_NPV[project_length] = working_capital * (general_inflation ** (project_length - 1));
    for (let i = 1 ; i < project_length ; i++) {
        working_capital_NPV[i] = (-1) * working_capital * (general_inflation ** (i - 1)) * (general_inflation - 1);
    }

    let sales_NPV = [];
    for (let i = 1 ; i <= project_length ; i++) {
        sales_NPV[i] = sales_revenue * (sales_revenue_inflation ** i);
    }

    let labour_materials_NPV = [];
    for (let i = 1 ; i <= project_length ; i++) {
        labour_materials_NPV[i] = (-1) * labour_materials_cost * (labour_materials_inflation ** i);
    }

    let electricity_NPV = [];
    for (let i = 1 ; i <= project_length ; i++) {
        electricity_NPV[i] = (-1) * electricity_cost * (electricity_inflation ** i);
    }

    let advertising_NPV = [];
    for (let i = 1 ; i <= years_advertising ; i++) {
        advertising_NPV[i] = (-1) * advertising_cost * (advertising_inflation ** i);
    }

    let capital_allowance_investment = initial_investment;
    let tax_NPV = [];
    for (let i = 1 ; i <= parseInt(project_length) ; i++) {
        let capital_allowance_value = i < project_length ? capital_allowance * capital_allowance_investment :
                                      capital_allowance_investment - scrap_value;
        capital_allowance_investment -= capital_allowance_value;

        let total_cost = labour_materials_cost * (labour_materials_inflation ** i) +
                         electricity_cost * (electricity_inflation ** i);
        if (i <= years_advertising) {
            total_cost += advertising_cost * (advertising_inflation ** i);
        }

        let cash_flow = (sales_revenue * (sales_revenue_inflation ** i)) - total_cost;
        let taxable_profit = cash_flow - capital_allowance_value;
        let tax = taxable_profit * tax_rate;

        tax_NPV[i + 1] = (-1) * tax;
    }

    let yearly_net = [];
    let components = [capital_NPV, 
                      working_capital_NPV, 
                      sales_NPV, 
                      labour_materials_NPV, 
                      electricity_NPV, 
                      advertising_NPV, 
                      tax_NPV];

    for (let i = 0 ; i < parseInt(project_length) + 2 ; i++) {
        let current_cost = 0;
        for (let j = 0 ; j < components.length ; j++) {
            if (components[j][i] !== undefined) {
                current_cost += components[j][i];
            }
        }
        yearly_net[i] = current_cost;
    }

    let yearly_discounted = [];
    for (let i = 0 ; i < yearly_net.length ; i++) {
        yearly_discounted[i] = yearly_net[i] / (nominal_cost_of_capital ** i);
    }

    let NPV = yearly_discounted.reduce((a, b) => a + b, 0);
    let NPV_rounded = (Math.round(Math.abs(NPV) * 100) / 100).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let NPV_final = NPV < 0 ? "( £" + NPV_rounded + " )" : "£" + NPV_rounded;

    document.getElementById("NPV").innerHTML = NPV_final;

    WorkingTable(components, yearly_net, yearly_discounted)
}

function WorkingTable(data, net_cashflow, present_value) {
    if (document.body.contains(document.getElementById("workings-table"))) {
        document.getElementById("workings-table").remove();
    }
    
    let table = document.createElement("table");
    table.style.width = "900px";
    table.style.border = "1px solid black";
    table.setAttribute("id", "workings-table");
    
    let headers = ["Year", "Capital", "Working Capital", "Sales", "Labour + Materials", "Energy", "Advertising", "Tax", "Net Cashflow", "Present Value"];

    let data_length = data.reduce((max, {length}) => Math.max(max, length), 0);
    let transposed_data = Array.from({length: data_length}, (_, i) => data.map(col => col[i]));

    let rounded_nom_cost_cap = Math.round((nominal_cost_of_capital - 1) * 100);
    
    for (let i = 0 ; i <= parseInt(project_length) + 2 ; i++) {
        let row = table.insertRow();

        for (let j = 0 ; j < 10 ; j++) {
            let cell = row.insertCell();
            if (i === 0) {
                cell.innerHTML = j != 9 ? headers[j] : headers[j] + " (" + rounded_nom_cost_cap + "%)";
            } else if (j === 0) {
                cell.innerHTML = i - 1;
            } else  if (j < 8){
                let data_cell = Math.round((transposed_data[i - 1][j - 1] / 1000) * 100) / 100 || " - ";
                cell.innerHTML = data_cell < 0 ? "(" + Commas(Math.abs(data_cell)) + ")" : Commas(data_cell);
            } else if (j === 8) {
                let data_cell = Math.round((net_cashflow[i - 1] / 1000) * 100) / 100 || " - ";
                cell.innerHTML = data_cell < 0 ? "(" + Commas(Math.abs(data_cell)) + ")" : Commas(data_cell);
            } else {
                let data_cell = Math.round((present_value[i - 1] / 1000) * 100) / 100 || " - ";
                cell.innerHTML = data_cell < 0 ? "(" + Commas(Math.abs(data_cell)) + ")" : Commas(data_cell);
            }
        }
    }
    document.getElementById("workings-table-wrapper").appendChild(table);
}

function Commas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}






























