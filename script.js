class SmartTrafficSystem {
    constructor() {
        this.isRunning = false;
        this.currentDirection = 'north';
        this.directions = ['north', 'south', 'east', 'west'];
        this.queues = {
            north: [],
            south: [],
            east: [],
            west: []
        };
        this.stats = {
            totalVehicles: 0,
            totalWaitTime: 0,
            efficiency: 100,
            processedCars: 0,
            throughput: 0
        };
        this.carIdCounter = 1;
        this.lightDuration = 4000;
        this.yellowDuration = 1500;
        this.emergencyMode = false;
        this.weatherCondition = 'clear';
        this.rushHourActive = false;
        this.aiPredictions = {
            nextCongestion: 'NONE',
            weatherImpact: 'CLEAR - 0%',
            rushHour: 'INACTIVE'
        };
        this.performanceData = [];
        this.systemUptime = 0;
        this.cycleStartTime = 0;
        this.currentAlgorithmStep = 0;
        this.logFilters = ['all'];
        this.emergencyVehicles = [];
        this.commandHistory = [];
        this.init();
    }

    init() {
        this.showLoadingScreen();
        setTimeout(() => {
            this.initializeSystem();
            this.bindEvents();
            this.startSystemClock();
            this.setupPeriodicCarGeneration();
            this.setupPerformanceMonitoring();
            this.hideLoadingScreen();
            this.logMessage('Neural network initialized successfully', 'system');
            this.updateCommandText('System online. Ready for traffic management.');
        }, 3000);
    }

    showLoadingScreen() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingBar = document.getElementById('loadingBar');
        const loadingDetails = document.getElementById('loadingDetails');
        
        const loadingSteps = [
            'Initializing neural networks...',
            'Loading traffic patterns...',
            'Calibrating sensors...',
            'Establishing connections...',
            'System ready!'
        ];
        
        let progress = 0;
        let stepIndex = 0;
        
        const loadingInterval = setInterval(() => {
            progress += 20;
            loadingBar.style.width = progress + '%';
            
            if (stepIndex < loadingSteps.length) {
                loadingDetails.textContent = loadingSteps[stepIndex];
                stepIndex++;
            }
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
            }
        }, 600);
    }

    hideLoadingScreen() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    }

    initializeSystem() {
        this.updateSystemStatus('STANDBY');
        this.updateAllDisplays();
        this.setAllLightsRed();
        this.generateInitialTraffic();
    }

    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startSystem());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseSystem());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSystem());
        document.getElementById('emergencyBtn').addEventListener('click', () => this.addEmergencyVehicle('ambulance'));

        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeWeather(e.target.dataset.weather));
        });

        document.querySelectorAll('.emergency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.addEmergencyVehicle(e.target.dataset.type));
        });

        document.querySelectorAll('.log-filter').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterLogs(e.target.dataset.filter));
        });

        document.getElementById('commandInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processCommand(e.target.value);
                e.target.value = '';
            }
        });

        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.startSystem();
            } else if (e.key === 'F2') {
                e.preventDefault();
                this.pauseSystem();
            } else if (e.key === 'F3') {
                e.preventDefault();
                this.resetSystem();
            } else if (e.key === 'F4') {
                e.preventDefault();
                this.addEmergencyVehicle('ambulance');
            }
        });
    }

    startSystem() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.updateSystemStatus('ACTIVE');
            this.logMessage('Traffic control system activated', 'system');
            this.updateCommandText('System active. Monitoring traffic flow...');
            this.runTrafficCycle();
        }
    }

    pauseSystem() {
        this.isRunning = false;
        this.updateSystemStatus('PAUSED');
        this.logMessage('System paused by operator', 'system');
        this.updateCommandText('System paused. Traffic lights in safe mode.');
        this.setAllLightsRed();
    }

    resetSystem() {
        this.isRunning = false;
        this.currentDirection = 'north';
        this.emergencyMode = false;
        this.rushHourActive = false;
        this.weatherCondition = 'clear';
        
        this.queues = {
            north: [],
            south: [],
            east: [],
            west: []
        };
        
        this.stats = {
            totalVehicles: 0,
            totalWaitTime: 0,
            efficiency: 100,
            processedCars: 0,
            throughput: 0
        };
        
        this.carIdCounter = 1;
        this.emergencyVehicles = [];
        this.performanceData = [];
        
        this.clearAllQueues();
        this.setAllLightsRed();
        this.updateSystemStatus('RESET');
        this.updateAllDisplays();
        this.clearLogs();
        this.logMessage('System reset completed. All subsystems reinitialized.', 'system');
        this.updateCommandText('System reset complete. Ready for new session.');
        
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.weather === 'clear');
        });
        
        setTimeout(() => {
            this.generateInitialTraffic();
            this.updateSystemStatus('STANDBY');
        }, 2000);
    }

    generateCar() {
        if (!this.isRunning && !this.emergencyMode) return;

        const randomDir = this.getRandomDirection();
        let carType = 'normal';
        let priority = 1;

        if (this.rushHourActive) {
            const rand = Math.random();
            if (rand < 0.08) {
                carType = 'emergency';
                priority = 10;
            } else if (rand < 0.25) {
                carType = 'priority';
                priority = 3;
            }
        } else {
            const rand = Math.random();
            if (rand < 0.03) {
                carType = 'emergency';
                priority = 10;
            } else if (rand < 0.15) {
                carType = 'priority';
                priority = 3;
            }
        }

        const weatherMultiplier = this.getWeatherMultiplier();
        const arrivalDelay = Math.random() * 1000 * weatherMultiplier;

        setTimeout(() => {
            const car = {
                id: this.carIdCounter++,
                type: carType,
                priority: priority,
                arrivalTime: Date.now(),
                direction: randomDir,
                waitTime: 0
            };

            this.queues[randomDir].push(car);
            this.stats.totalVehicles++;
            
            if (carType === 'emergency') {
                this.emergencyVehicles.push(car);
                this.triggerEmergencyMode(randomDir);
            }

            this.renderQueue(randomDir);
            this.updateAllDisplays();
            this.logMessage(`Vehicle ${car.id} (${carType.toUpperCase()}) entered ${randomDir.toUpperCase()} lane`, 'traffic');
            
            this.updateAIPredictions();
        }, arrivalDelay);
    }

    setupPeriodicCarGeneration() {
        setInterval(() => {
            if (this.isRunning || this.emergencyMode) {
                const rushMultiplier = this.rushHourActive ? 2.5 : 1;
                const weatherMultiplier = this.getWeatherMultiplier();
                const numCars = Math.floor((Math.random() * 3 + 1) * rushMultiplier * weatherMultiplier);
                
                for (let i = 0; i < numCars; i++) {
                    setTimeout(() => this.generateCar(), i * 300);
                }
            }
        }, 2500);
    }

    getWeatherMultiplier() {
        switch (this.weatherCondition) {
            case 'rain': return 0.7;
            case 'fog': return 0.5;
            case 'storm': return 0.3;
            default: return 1;
        }
    }

    changeWeather(weather) {
        this.weatherCondition = weather;
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.weather === weather);
        });
        
        let impact = '0%';
        let description = weather.toUpperCase();
        
        switch (weather) {
            case 'rain':
                impact = '30%';
                this.lightDuration = 5000;
                break;
            case 'fog':
                impact = '50%';
                this.lightDuration = 6000;
                break;
            case 'storm':
                impact = '70%';
                this.lightDuration = 7000;
                break;
            default:
                impact = '0%';
                this.lightDuration = 4000;
                break;
        }
        
        this.aiPredictions.weatherImpact = `${description} - ${impact}`;
        this.updateAIPredictions();
        this.logMessage(`Weather conditions changed to ${description}. Traffic flow adjusted.`, 'system');
    }

    addEmergencyVehicle(type) {
        const randomDir = this.getRandomDirection();
        const emergencyIcons = {
            ambulance: '🚑',
            fire: '🚒',
            police: '🚔',
            evacuation: '🚨'
        };

        const emergencyCar = {
            id: this.carIdCounter++,
            type: 'emergency',
            priority: 10,
            arrivalTime: Date.now(),
            direction: randomDir,
            emergencyType: type,
            icon: emergencyIcons[type]
        };

        this.queues[randomDir].unshift(emergencyCar);
        this.stats.totalVehicles++;
        this.emergencyVehicles.push(emergencyCar);

        this.triggerEmergencyMode(randomDir);
        this.renderQueue(randomDir);
        this.updateAllDisplays();
        this.logMessage(`${type.toUpperCase()} dispatched to ${randomDir.toUpperCase()} lane - Emergency protocol activated`, 'emergency');
        this.updateCommandText(`Emergency vehicle deployed. Clearing ${randomDir.toUpperCase()} corridor...`);
    }

    triggerEmergencyMode(direction) {
        this.emergencyMode = true;
        document.getElementById('emergencyStatus').textContent = 'ACTIVE';
        document.getElementById('emergencyStatus').classList.add('active');
        document.getElementById('emergencyOverlay').classList.add('active');
        
        if (this.isRunning) {
            this.processEmergencyTraffic(direction);
        }

        setTimeout(() => {
            this.emergencyMode = false;
            document.getElementById('emergencyStatus').textContent = 'STANDBY';
            document.getElementById('emergencyStatus').classList.remove('active');
            document.getElementById('emergencyOverlay').classList.remove('active');
        }, 8000);
    }

    processEmergencyTraffic(direction) {
        this.currentDirection = direction;
        this.setAllLightsRed();
        this.logMessage(`Emergency protocol: All lights RED. Clearing ${direction.toUpperCase()} lane...`, 'emergency');
        
        setTimeout(() => {
            this.setTrafficLight(direction, 'green');
            this.logMessage(`${direction.toUpperCase()} lane cleared for emergency vehicle`, 'emergency');
            setTimeout(() => this.processCars(direction, true), 500);
        }, 1000);
    }

    async runTrafficCycle() {
        if (!this.isRunning) return;

        this.cycleStartTime = Date.now();
        
        await this.executeAlgorithmStep(1, 'Scanning all traffic lanes...', () => {
            this.updateQueueCounts();
            this.calculateWaitTimes();
        });

        await this.executeAlgorithmStep(2, 'Computing priority scores...', () => {
            this.currentDirection = this.calculateOptimalDirection();
        });

        await this.executeAlgorithmStep(3, 'Optimizing signal timing...', async () => {
            await this.changeTrafficLights(this.currentDirection);
        });

        await this.executeAlgorithmStep(4, 'Processing vehicle flow...', async () => {
            await this.processCars(this.currentDirection);
        });

        this.clearAlgorithmSteps();
        this.updatePerformanceMetrics();
        
        setTimeout(() => this.runTrafficCycle(), 1500);
    }

    async executeAlgorithmStep(stepNumber, description, action) {
        this.highlightAlgorithmStep(stepNumber);
        this.updateCommandText(description);
        
        const progressBar = document.getElementById(`progress${stepNumber}`);
        progressBar.style.width = '0%';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = progress + '%';
            if (progress >= 100) clearInterval(interval);
        }, 80);

        await this.delay(800);
        if (action) await action();
    }

    highlightAlgorithmStep(stepNumber) {
        document.querySelectorAll('.algo-step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById(`step${stepNumber}`).classList.add('active');
    }

    clearAlgorithmSteps() {
        document.querySelectorAll('.algo-step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelectorAll('.progress-fill').forEach(bar => {
            bar.style.width = '0%';
        });
    }

    calculateOptimalDirection() {
        let maxScore = -1;
        let optimalDirection = this.currentDirection;

        this.directions.forEach(direction => {
            const queue = this.queues[direction];
            if (queue.length === 0) return;

            let prioritySum = 0;
            let waitTimeBonus = 0;
            let emergencyBonus = 0;
            const currentTime = Date.now();

            queue.forEach(car => {
                prioritySum += car.priority;
                const waitTime = (currentTime - car.arrivalTime) / 1000;
                waitTimeBonus += Math.min(waitTime / 8, 3);
                if (car.type === 'emergency') emergencyBonus += 50;
            });

            const queueLength = queue.length;
            const weatherPenalty = this.weatherCondition !== 'clear' ? -2 : 0;
            const score = prioritySum + waitTimeBonus + emergencyBonus + (queueLength * 0.7) + weatherPenalty;

            if (score > maxScore) {
                maxScore = score;
                optimalDirection = direction;
            }
        });

        return optimalDirection;
    }

    async changeTrafficLights(newDirection) {
        if (this.currentDirection !== newDirection) {
            this.logMessage(`Switching traffic flow: ${this.currentDirection.toUpperCase()} → ${newDirection.toUpperCase()}`, 'traffic');

            if (this.currentDirection) {
                this.setTrafficLight(this.currentDirection, 'yellow');
                await this.delay(this.yellowDuration);
            }

            this.setAllLightsRed();
            await this.delay(600);

            this.setTrafficLight(newDirection, 'green');
            this.currentDirection = newDirection;
            
            document.getElementById('activeLane').textContent = newDirection.toUpperCase();
        }
    }

    async processCars(direction, isEmergency = false) {
        const queue = this.queues[direction];
        if (queue.length === 0) return;

        queue.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return a.arrivalTime - b.arrivalTime;
        });

        const maxCars = isEmergency ? queue.length : Math.min(queue.length, Math.floor(Math.random() * 4) + 3);
        const processedCars = [];
        const currentTime = Date.now();

        for (let i = 0; i < maxCars; i++) {
            const car = queue.shift();
            if (car) {
                const waitTime = (currentTime - car.arrivalTime) / 1000;
                car.waitTime = waitTime;
                processedCars.push(car);
                
                this.stats.totalWaitTime += waitTime;
                this.stats.processedCars++;
                
                if (car.type === 'emergency') {
                    this.emergencyVehicles = this.emergencyVehicles.filter(v => v.id !== car.id);
                    this.logMessage(`Emergency vehicle ${car.id} cleared intersection (${waitTime.toFixed(1)}s)`, 'emergency');
                } else {
                    this.logMessage(`Vehicle ${car.id} processed from ${direction.toUpperCase()} (${waitTime.toFixed(1)}s wait)`, 'info');
                }

                this.animateVehicleMovement(direction, car);
                await this.delay(200);
            }
        }

        this.renderQueue(direction);
        this.updateEfficiency();
        this.updateAllDisplays();
    }

    animateVehicleMovement(direction, car) {
        const queueElement = document.getElementById(`${direction}Queue`);
        const carElement = queueElement.querySelector(`[data-car-id="${car.id}"]`);

        if (carElement) {
            carElement.classList.add('moving');
            setTimeout(() => {
                if (carElement.parentNode) {
                    carElement.remove();
                }
            }, 1000);
        }
    }

    setTrafficLight(direction, color) {
        const lightElement = document.getElementById(`${direction}Light`);
        if (lightElement) {
            const lights = lightElement.querySelectorAll('.light');
            lights.forEach(light => light.classList.remove('active'));

            const targetLight = lightElement.querySelector(`.light.${color}`);
            if (targetLight) {
                targetLight.classList.add('active');
            }
        }
    }

    setAllLightsRed() {
        this.directions.forEach(direction => {
            this.setTrafficLight(direction, 'red');
        });
    }

    renderQueue(direction) {
        const queueElement = document.getElementById(`${direction}Queue`);
        const queue = this.queues[direction];

        queueElement.innerHTML = '';

        queue.forEach((car, index) => {
            const carElement = document.createElement('div');
            carElement.className = `vehicle ${car.type}`;
            carElement.setAttribute('data-car-id', car.id);
            
            if (car.emergencyType && car.icon) {
                carElement.textContent = car.icon;
                carElement.title = `${car.emergencyType.toUpperCase()} Vehicle ${car.id}`;
            } else {
                carElement.textContent = car.id;
                carElement.title = `Vehicle ${car.id} - ${car.type.toUpperCase()} (Priority: ${car.priority})`;
            }

            queueElement.appendChild(carElement);
        });
    }

    updateQueueCounts() {
        this.directions.forEach(direction => {
            const count = this.queues[direction].length;
            const countElement = document.getElementById(`${direction}Count`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }

    calculateWaitTimes() {
        const currentTime = Date.now();
        this.directions.forEach(direction => {
            const queue = this.queues[direction];
            let totalWait = 0;
            
            queue.forEach(car => {
                totalWait += (currentTime - car.arrivalTime) / 1000;
            });
            
            const avgWait = queue.length > 0 ? (totalWait / queue.length).toFixed(1) : 0;
        });
    }

    updateAllDisplays() {
        document.getElementById('totalVehicles').textContent = this.stats.totalVehicles;
        
        const avgWaitTime = this.stats.processedCars > 0 
            ? (this.stats.totalWaitTime / this.stats.processedCars).toFixed(1) 
            : '0.0';
        document.getElementById('avgWait').textContent = `${avgWaitTime}s`;
        
        document.getElementById('efficiency').textContent = `${Math.round(this.stats.efficiency)}%`;
        document.getElementById('throughput').textContent = `${this.stats.throughput}/min`;
        document.getElementById('processedCount').textContent = this.stats.processedCars;
        
        this.updateStatBars();
        this.updateQueueCounts();
        this.calculateWaitTimes();
    }

    updateStatBars() {
        const vehicleBar = document.getElementById('vehicleBar');
        const waitBar = document.getElementById('waitBar');
        const efficiencyBar = document.getElementById('efficiencyBar');
        const throughputBar = document.getElementById('throughputBar');
        
        const maxVehicles = 100;
        const maxWait = 30;
        const maxThroughput = 60;
        
        vehicleBar.style.width = `${Math.min((this.stats.totalVehicles / maxVehicles) * 100, 100)}%`;
        
        const avgWait = this.stats.processedCars > 0 ? this.stats.totalWaitTime / this.stats.processedCars : 0;
        waitBar.style.width = `${Math.min((avgWait / maxWait) * 100, 100)}%`;
        
        efficiencyBar.style.width = `${this.stats.efficiency}%`;
        throughputBar.style.width = `${Math.min((this.stats.throughput / maxThroughput) * 100, 100)}%`;
    }

    updateEfficiency() {
        const avgWaitTime = this.stats.processedCars > 0 
            ? this.stats.totalWaitTime / this.stats.processedCars 
            : 0;
        
        const totalQueueLength = Object.values(this.queues)
            .reduce((sum, queue) => sum + queue.length, 0);

        let efficiency = 100;
        efficiency -= Math.min(avgWaitTime * 1.5, 25);
        efficiency -= Math.min(totalQueueLength * 2, 35);
        
        if (this.weatherCondition !== 'clear') {
            efficiency -= this.getWeatherPenalty();
        }
        
        if (this.emergencyMode) {
            efficiency += 10;
        }

        this.stats.efficiency = Math.max(efficiency, 15);
    }

    getWeatherPenalty() {
        switch (this.weatherCondition) {
            case 'rain': return 10;
            case 'fog': return 20;
            case 'storm': return 30;
            default: return 0;
        }
    }

    updatePerformanceMetrics() {
        const cycleTime = Date.now() - this.cycleStartTime;
        document.getElementById('executionTime').textContent = `${cycleTime.toFixed(2)}ms`;
        
        this.stats.throughput = this.stats.processedCars > 0 
            ? Math.round((this.stats.processedCars / (this.systemUptime / 60000)) || 0)
            : 0;
        
        this.performanceData.push({
            timestamp: Date.now(),
            efficiency: this.stats.efficiency,
            throughput: this.stats.throughput,
            queueLength: Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0)
        });
        
        if (this.performanceData.length > 50) {
            this.performanceData.shift();
        }
    }

    setupPerformanceMonitoring() {
        setInterval(() => {
            const memoryUsage = performance.memory 
                ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
                : Math.floor(Math.random() * 50) + 20;
            
            const cpuUsage = Math.floor(Math.random() * 30) + 10;
            const networkSpeed = Math.floor(Math.random() * 1000) + 500;
            
            document.getElementById('memoryUsage').textContent = `${memoryUsage} MB`;
            document.getElementById('cpuUsage').textContent = `CPU: ${cpuUsage}%`;
            document.getElementById('networkSpeed').textContent = `${networkSpeed} KB/s`;
        }, 2000);
    }

    updateAIPredictions() {
        const queueLengths = Object.entries(this.queues).map(([dir, queue]) => ({
            direction: dir,
            length: queue.length
        }));
        
        queueLengths.sort((a, b) => b.length - a.length);
        
        if (queueLengths[0].length > 5) {
            const eta = Math.floor(queueLengths[0].length * 0.5);
            this.aiPredictions.nextCongestion = `${queueLengths[0].direction.toUpperCase()} - ${eta}min`;
        } else {
            this.aiPredictions.nextCongestion = 'NONE DETECTED';
        }
        
        const totalVehicles = Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0);
        if (totalVehicles > 20 && !this.rushHourActive) {
            this.rushHourActive = true;
            this.aiPredictions.rushHour = 'ACTIVE';
            this.logMessage('Rush hour pattern detected. Adjusting traffic algorithms.', 'system');
        } else if (totalVehicles < 8 && this.rushHourActive) {
            this.rushHourActive = false;
            this.aiPredictions.rushHour = 'INACTIVE';
        }
        
        document.getElementById('nextCongestion').textContent = this.aiPredictions.nextCongestion;
        document.getElementById('weatherImpact').textContent = this.aiPredictions.weatherImpact;
        document.getElementById('rushHour').textContent = this.aiPredictions.rushHour;
    }

    startSystemClock() {
        setInterval(() => {
            this.systemUptime += 1000;
            const uptime = this.formatUptime(this.systemUptime);
            document.getElementById('uptime').textContent = uptime;
            
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour12: false });
            document.getElementById('systemTime').textContent = timeString;
        }, 1000);
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000) % 60;
        const minutes = Math.floor(ms / (1000 * 60)) % 60;
        const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    logMessage(message, type = 'info') {
        const logContainer = document.getElementById('logContainer');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        
        const typeMap = {
            'system': '[SYS]',
            'traffic': '[TRF]',
            'emergency': '[EMG]',
            'info': '[INF]'
        };
        
        logEntry.innerHTML = `
            <span class="log-time">${timeString}</span>
            <span class="log-type ${type}">${typeMap[type] || '[INF]'}</span>
            <span class="log-message">${message}</span>
        `;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        const logEntries = logContainer.querySelectorAll('.log-entry');
        if (logEntries.length > 100) {
            logEntries[0].remove();
        }
    }

    filterLogs(filter) {
        document.querySelectorAll('.log-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        const logEntries = document.querySelectorAll('.log-entry');
        logEntries.forEach(entry => {
            if (filter === 'all' || entry.classList.contains(filter)) {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        });
    }

    clearLogs() {
        const logContainer = document.getElementById('logContainer');
        logContainer.innerHTML = '';
    }

    processCommand(command) {
        this.commandHistory.push(command);
        const cmd = command.toLowerCase().trim();
        
        this.logMessage(`Command executed: ${command}`, 'system');
        
        switch (cmd) {
            case 'status':
                this.logMessage('System operational. All subsystems nominal.', 'info');
                break;
            case 'emergency':
                this.addEmergencyVehicle('ambulance');
                break;
            case 'reset':
                this.resetSystem();
                break;
            case 'stats':
                this.logMessage(`Vehicles: ${this.stats.totalVehicles}, Efficiency: ${this.stats.efficiency}%, Throughput: ${this.stats.throughput}/min`, 'info');
                break;
            case 'weather clear':
                this.changeWeather('clear');
                break;
            case 'weather rain':
                this.changeWeather('rain');
                break;
            case 'weather fog':
                this.changeWeather('fog');
                break;
            case 'weather storm':
                this.changeWeather('storm');
                break;
            case 'help':
                this.logMessage('Available commands: status, emergency, reset, stats, weather [clear/rain/fog/storm], help', 'info');
                break;
            default:
                this.logMessage(`Unknown command: ${command}`, 'info');
                break;
        }
    }

    updateSystemStatus(status) {
        document.getElementById('coreStatus').textContent = status;
        const indicator = document.getElementById('systemIndicator');
        
        indicator.className = 'status-indicator';
        if (status === 'ACTIVE') {
            indicator.classList.add('active');
        }
    }

    updateCommandText(text) {
        document.getElementById('commandText').textContent = text;
    }

    generateInitialTraffic() {
        setTimeout(() => {
            for (let i = 0; i < 12; i++) {
                setTimeout(() => this.generateCar(), i * 400);
            }
        }, 1000);
    }

    clearAllQueues() {
        this.directions.forEach(direction => {
            document.getElementById(`${direction}Queue`).innerHTML = '';
        });
    }

    getRandomDirection() {
        return this.directions[Math.floor(Math.random() * this.directions.length)];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SmartTrafficSystem();
});