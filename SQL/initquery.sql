CREATE TABLE MainCategory(
	MainCategoryID int primary key,
	CategoryName varchar(100)
)

CREATE TABLE SubCategory(
	SubCategoryID int primary key,
	CategoryName varchar(100)
)

CREATE TABLE Products(
	Barcode bigint primary key,
	MainCategoryID int foreign key references MainCategory(MainCategoryID),
	SubCategoryID int foreign key references SubCategory(SubCategoryID),
	Name varchar(100),
	ImageLink varchar(255)
)

CREATE TABLE Users(
	UserID int primary key,
	Email varchar(100),
	Password varchar(100),
	DisplayName varchar(100)
)

CREATE TABLE Favourites(
	Barcode bigint foreign key references Products(barcode),
	UserID int foreign key references Users(userID),
	PRIMARY KEY (barcode, userID)
)

CREATE TABLE Shop(
	ShopID int primary key,
	ShopName varchar(100)
)

CREATE TABLE Price(
	Barcode bigint foreign key references Products(Barcode),
	ShopID int foreign key references Shop(shopID),
	Price int,
	Discount bit,
	PerWeight bit,
	PRIMARY KEY (barcode, shopID)
)

CREATE TABLE List(
	UserID int foreign key references Users(userID),
	Barcode bigint foreign key references Products(barcode),
	Quantity int,
	InCart bit,
	CurrentPrice int,
	ShopID int foreign key references Shop(shopID),
	PRIMARY KEY (userID, barcode)
)

CREATE TABLE History(
	PurchaseID int,
	Barcode bigint foreign key references Products(barcode),
	UserID int foreign key references Users(userID),
	Date date,
	Quantity int,
	CurrentPrice int,
	ShopID int foreign key references Shop(shopID)
	PRIMARY KEY(barcode, purchaseID)
)

--test product
INSERT INTO MainCategory(MainCategoryID,CategoryName)
VALUES(1,'Italok')
INSERT INTO SubCategory(SubCategoryID,CategoryName)
VALUES(1,'Üdítőitalok')
INSERT INTO Products (Barcode, MainCategoryID, SubCategoryID, Name, ImageLink)
VALUES (5449000025173, 1, 1, 'Coca-Cola 2,25 l', 'https://secure.ce-tescoassets.com/assets/HU/173/5449000025173/ShotType1_225x225.jpg')
INSERT INTO Shop(ShopID, ShopName)
VALUES (1, 'Tesco')
INSERT INTO Price (Barcode, ShopID, Price, Discount, PerWeight)
VALUES(5449000025173, 1, 769, 0, 0)

SELECT * FROM Products prod JOIN Price on prod.Barcode = Price.Barcode

/*
DROP TABLE Favourites
DROP TABLE History
DROP TABLE List
DROP TABLE Price
DROP TABLE Products
DROP TABLE Shop
DROP TABLE Users
DROP TABLE SubCategory
DROP TABLE MainCategory
*/